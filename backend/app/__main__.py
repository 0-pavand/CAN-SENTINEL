import argparse
import sys
from app.core.logger import get_logger
from app.parsers.asc_parser import ASCParser
from app.parsers.statistics import ParserStatistics

logger = get_logger("cli")

def main():
    parser = argparse.ArgumentParser(description="CAN Anomaly Detector")
    subparsers = parser.add_subparsers(dest="command")
    
    parse_parser = subparsers.add_parser("parse", help="Parse ASC log file")
    parse_parser.add_argument("--input", required=True, help="Path to CAN.log")
    
    decode_parser = subparsers.add_parser("decode", help="Parse and decode ASC log file using DBC")
    decode_parser.add_argument("--input", required=True, help="Path to CAN.log")
    decode_parser.add_argument("--dbc", required=True, help="Path to CAN.dbc")
    decode_parser.add_argument("--limit", type=int, default=10, help="Number of frames to print")
    
    extract_parser = subparsers.add_parser("extract", help="Extract features and export dataset")
    extract_parser.add_argument("--input", required=True, help="Path to CAN.log")
    extract_parser.add_argument("--dbc", required=True, help="Path to CAN.dbc")
    extract_parser.add_argument("--output", required=True, help="Path to output CSV")
    
    detect_parser = subparsers.add_parser("detect", help="Run detection engine and evaluate")
    detect_parser.add_argument("--input", required=True, help="Path to CAN.log")
    detect_parser.add_argument("--dbc", required=True, help="Path to CAN.dbc")
    detect_parser.add_argument("--gt", required=True, help="Path to ground_truth.json")
    
    prep_parser = subparsers.add_parser("prep-ml", help="Prepare ML dataset")
    prep_parser.add_argument("--input", required=True, help="Path to CAN.log")
    prep_parser.add_argument("--dbc", required=True, help="Path to CAN.dbc")
    prep_parser.add_argument("--gt", required=True, help="Path to ground_truth.json")
    prep_parser.add_argument("--out", required=True, help="Path to output directory")
    
    train_parser = subparsers.add_parser("train-ml", help="Train DL model")
    train_parser.add_argument("--dataset", required=True, help="Path to ml_dataset.npz")
    train_parser.add_argument("--out", required=True, help="Path to output directory for models")

    optimize_parser = subparsers.add_parser("optimize", help="Optimize PyTorch model to ONNX")
    optimize_parser.add_argument("--input", default="models/can_net.pth", help="Input PyTorch model path")
    optimize_parser.add_argument("--output", default="models/can_net.onnx", help="Output ONNX model path")

    api_parser = subparsers.add_parser("api", help="Start the FastAPI server")
    api_parser.add_argument("--host", default="0.0.0.0", help="Host IP")
    api_parser.add_argument("--port", type=int, default=8000, help="Port number")

    analyze_parser = subparsers.add_parser("analyze", help="Run analysis directly via CLI")
    analyze_parser.add_argument("--input", required=True, help="Input CAN log file")
    analyze_parser.add_argument("--dbc", required=True, help="Input DBC file")
    analyze_parser.add_argument("--mode", choices=["rules", "dl", "hybrid"], default="hybrid", help="Analysis mode")
    analyze_parser.add_argument("--onnx", default="models/can_net.onnx", help="ONNX model path")
    
    args = parser.parse_args()
    
    if args.command == "parse":
        asc_parser = ASCParser()
        stats = ParserStatistics()
        
        try:
            for frame in asc_parser.parse(args.input):
                stats.update(frame)
            print(stats.summary())
        except Exception as e:
            logger.error(f"Error parsing file: {e}")
            sys.exit(1)
            
    elif args.command == "decode":
        from app.dbc.decoder import DbcDecoder
        asc_parser = ASCParser()
        try:
            decoder = DbcDecoder(args.dbc)
            count = 0
            for frame in asc_parser.parse(args.input):
                if count >= args.limit:
                    break
                try:
                    decoded = decoder.decode(frame)
                    print(f"[{decoded.timestamp:.6f}] {decoded.message_name} (0x{decoded.can_id:03X}):")
                    for sig_name, sig_val in decoded.signals.items():
                        enum_str = f" ({sig_val.enum_label})" if sig_val.enum_label else ""
                        print(f"    {sig_name}: {sig_val.physical_value} {sig_val.unit}{enum_str} [raw: {sig_val.raw_value}]")
                    count += 1
                except Exception as ex:
                    logger.warning(f"Decode error at {frame.timestamp:.6f} for ID 0x{frame.arbitration_id:03X}: {ex}")
                    count += 1
        except Exception as e:
            logger.error(f"Error decoding: {e}")
            sys.exit(1)
            
    elif args.command == "extract":
        import csv
        from app.dbc.decoder import DbcDecoder
        from app.features.pipeline import FeaturePipeline
        from app.core.errors import DbcDecodingError
        
        asc_parser = ASCParser()
        pipeline = FeaturePipeline()
        decoder = DbcDecoder(args.dbc)
        
        rows = []
        try:
            for frame in asc_parser.parse(args.input):
                decoded = None
                try:
                    decoded = decoder.decode(frame)
                except DbcDecodingError:
                    pass # We still process the frame even if it fails to decode
                    
                features = pipeline.process(frame, decoded)
                rows.append(features)
                
            if not rows:
                print("No frames extracted.")
                sys.exit(0)
                
            # Collect all possible columns
            columns = set()
            for r in rows:
                columns.update(r.keys())
            columns = sorted(list(columns))
            
            # Ensure critical columns are first
            for col in ["timestamp", "can_id", "dlc"]:
                if col in columns:
                    columns.remove(col)
                    columns.insert(0, col)
                    
            with open(args.output, 'w', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=columns)
                writer.writeheader()
                for r in rows:
                    writer.writerow(r)
            print(f"Successfully extracted {len(rows)} feature rows to {args.output}")
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            sys.exit(1)
            
    elif args.command == "detect":
        import json
        from app.detectors.engine import DetectionEngine
        from app.evaluation.ground_truth import load_ground_truth
        from app.evaluation.metrics import Evaluator
        
        asc_parser = ASCParser()
        engine = DetectionEngine(args.dbc)
        gt_events = load_ground_truth(args.gt)
        evaluator = Evaluator(gt_events, time_tolerance=0.05)
        
        all_alerts = []
        try:
            print("Running Detection Engine...")
            for frame in asc_parser.parse(args.input):
                alerts = engine.process(frame)
                if alerts:
                    for a in alerts:
                        print(f"[{a.timestamp:.6f}] ALERT: {a.anomaly_type} on 0x{a.can_id:03X} - {a.description}")
                    all_alerts.extend(alerts)
                    
            print(f"\nTotal Alerts Fired: {len(all_alerts)}")
            print("Evaluating against Ground Truth...")
            
            results = evaluator.evaluate(all_alerts)
            overall = results["overall"]
            print(f"\n=== EVALUATION RESULTS ===")
            print(f"Precision: {overall['precision']:.4f}")
            print(f"Recall:    {overall['recall']:.4f}")
            print(f"F1 Score:  {overall['f1']:.4f}")
            print(f"Avg Latency: {overall['avg_latency']:.4f}s")
            print(f"True Positives:  {overall['true_positives']}")
            print(f"False Positives: {overall['false_positives']}")
            print(f"False Negatives: {overall['false_negatives']}")
            
            print("\n=== PER ANOMALY ===")
            for a_id, info in results["per_anomaly"].items():
                status = "DETECTED" if info["detected"] else "MISSED"
                latency = f"{info['latency']:.4f}s" if info["latency"] is not None else "N/A"
                print(f"{a_id}: {status} (Latency: {latency})")
                
        except Exception as e:
            logger.error(f"Error during detection: {e}")
            sys.exit(1)
            
    elif args.command == "prep-ml":
        import os
        from app.dbc.decoder import DbcDecoder
        from app.features.pipeline import FeaturePipeline
        from app.core.errors import DbcDecodingError
        from app.evaluation.ground_truth import load_ground_truth
        from app.ml.dataset_prep import DatasetGenerator
        from app.ml.utils import split_dataset_sequentially, save_dataset
        import numpy as np
        
        asc_parser = ASCParser()
        pipeline = FeaturePipeline()
        decoder = DbcDecoder(args.dbc)
        gt_events = load_ground_truth(args.gt)
        generator = DatasetGenerator(sequence_length=16, stride=8)
        
        print("Extracting features from CAN.log...")
        raw_features = []
        for frame in asc_parser.parse(args.input):
            decoded = None
            try:
                decoded = decoder.decode(frame)
            except DbcDecodingError:
                pass
                
            features = pipeline.process(frame, decoded)
            raw_features.append(features)
            
        print(f"Extracted {len(raw_features)} raw feature frames.")
        print("Generating sequences and normalizing...")
        
        X_seq, y_seq = generator.generate(raw_features, gt_events)
        
        print(f"Sequence dimensions: X={X_seq.shape}, y={y_seq.shape}")
        
        print("Splitting dataset sequentially (no temporal leakage)...")
        X_train, y_train, X_val, y_val, X_test, y_test = split_dataset_sequentially(X_seq, y_seq)
        
        print(f"Train samples: {len(X_train)}")
        print(f"Val samples:   {len(X_val)}")
        print(f"Test samples:  {len(X_test)}")
        
        # Save dataset
        dataset_path = os.path.join(args.out, "ml_dataset.npz")
        save_dataset(dataset_path, X_train, y_train, X_val, y_val, X_test, y_test)
        print(f"Saved dataset to {dataset_path}")
        
        # Save scaler config
        config_path = os.path.join(args.out, "scaler_config.json")
        generator.save_config(config_path)
        print(f"Saved scaler config to {config_path}")
        
        print("\n=== Dataset Statistics ===")
        print(f"Total Sequences: {len(y_seq)}")
        print(f"Total Anomalous Sequences: {np.sum(y_seq)} ({(np.sum(y_seq)/len(y_seq))*100:.2f}%)")
        print(f"Feature Dimensions: {X_seq.shape[2]}")
            
    elif args.command == "train-ml":
        import numpy as np
        import os
        from app.ml.trainer import ModelTrainer
        from app.ml.evaluate import ModelEvaluator
        
        print(f"Loading dataset from {args.dataset}")
        data = np.load(args.dataset)
        X_train, y_train = data['X_train'], data['y_train']
        X_val, y_val = data['X_val'], data['y_val']
        X_test, y_test = data['X_test'], data['y_test']
        
        num_features = X_train.shape[2]
        sequence_length = X_train.shape[1]
        
        trainer = ModelTrainer(num_features=num_features, sequence_length=sequence_length, learning_rate=0.005)
        
        model_save_path = os.path.join(args.out, "can_net.pth")
        
        print("\n--- Starting Training ---")
        history = trainer.train(X_train, y_train, X_val, y_val, epochs=50, batch_size=8, patience=10, model_save_path=model_save_path)
        
        print("\n--- Evaluating on Test Set ---")
        evaluator = ModelEvaluator(model_save_path, num_features=num_features, sequence_length=sequence_length)
        results = evaluator.evaluate(X_test, y_test)
        
        print("\n=== DEEP LEARNING RESULTS ===")
        print(f"Accuracy:  {results['accuracy']:.4f}")
        print(f"Precision: {results['precision']:.4f}")
        print(f"Recall:    {results['recall']:.4f}")
        print(f"F1 Score:  {results['f1']:.4f}")
        print(f"False Pos Rate: {results['false_positive_rate']:.4f}")
        print(f"Inference Latency: {results['avg_latency_ms']:.4f} ms/sequence")
        print(f"Parameter Count: {results['parameter_count']}")
            
    elif args.command == "optimize":
        from app.ml.optimize import ONNXOptimizer
        print(f"Optimizing model {args.input} to {args.output}...")
        try:
            optimizer = ONNXOptimizer(args.input, args.output)
            optimizer.export_to_onnx()
        except Exception as e:
            print(f"Failed to optimize model: {e}")
            sys.exit(1)
            
    elif args.command == "api":
        import uvicorn
        print(f"Starting FastAPI server on {args.host}:{args.port}")
        uvicorn.run("app.api.main:app", host=args.host, port=args.port, reload=True)
        
    elif args.command == "analyze":
        print(f"Starting {args.mode} analysis on {args.input}")
        import asyncio
        from app.services.analysis_service import analysis_service
        
        request_data = {
            "filepath": args.input,
            "dbc_path": args.dbc,
            "mode": args.mode,
            "onnx_model_path": args.onnx
        }
        
        # Run async function synchronously
        job_id = asyncio.run(analysis_service.start_analysis(request_data))
        print(f"Job ID: {job_id}")
        
        # Wait for completion
        while True:
            status = analysis_service.get_job_status(job_id)
            if status.status in ["complete", "failed"]:
                break
            import time
            time.sleep(0.5)
            
        if status.status == "complete":
            results = analysis_service.get_job_results(job_id)
            print(f"Analysis complete in {results.execution_time:.2f}s")
            print(f"Total Frames: {results.total_frames}")
            print(f"Total Anomalies: {len(results.anomalies)}")
        else:
            print(f"Analysis failed: {status.error}")
            
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
