import argparse
import sys
from app.core.logger import get_logger
from app.core.config import settings

logger = get_logger("cli")

def main():
    parser = argparse.ArgumentParser(description="CAN Anomaly Detector CLI")
    subparsers = parser.add_subparsers(dest="command")
    
    status_parser = subparsers.add_parser("status", help="Check engine status")
    
    analyze_parser = subparsers.add_parser("analyze", help="Run end-to-end analysis")
    analyze_parser.add_argument("--log", required=True, help="Input CAN.log file")
    analyze_parser.add_argument("--dbc", required=True, help="Input CAN.dbc file")
    analyze_parser.add_argument("--mode", choices=["rules", "dl", "hybrid"], default="hybrid", help="Detection mode")
    analyze_parser.add_argument("--json", help="Output results to JSON file")
    
    args = parser.parse_args()
    
    if args.command == "status":
        logger.info(f"Engine {settings.app_name} is ready. Log level: {settings.log_level}")
        print("OK")
    elif args.command == "analyze":
        import asyncio
        import time
        import json
        from app.services.analysis_service import analysis_service
        
        request_data = {
            "filepath": args.log,
            "dbc_path": args.dbc,
            "mode": args.mode,
            "onnx_model_path": "models/can_net.onnx",
            "scaler_config_path": "../data/scaler_config.json"
        }
        
        if not getattr(args, "quiet", False):
            print("================================================")
            print("CAN ANOMALY DETECTOR")
            print("================================================")
            print()
            print("INPUT")
            print(f"  CAN log: {args.log}")
            print(f"  DBC: {args.dbc}")
            print()
            print("[1/6] Parsing CAN traffic...")
            print("[2/6] Decoding CAN messages...")
            print("[3/6] Extracting features...")
            print("[4/6] Running rule-based detection...")
            print("[5/6] Running DL inference...")
            print("[6/6] Running hybrid analysis...")
            print()
            
        try:
            job_id = asyncio.run(analysis_service.start_analysis(request_data))
        except Exception as e:
            print(f"Failed to start analysis: {e}")
            sys.exit(1)
            
        while True:
            status = analysis_service.get_job_status(job_id)
            if status.status in ["complete", "failed"]:
                break
            time.sleep(0.5)
            
        if status.status == "failed":
            print(f"Analysis failed: {status.error}")
            sys.exit(1)
            
        results = analysis_service.get_job_results(job_id)
        
        if not getattr(args, "quiet", False):
            print("ANALYSIS COMPLETE\n")
            print("Statistics:")
            print(f"  Frames processed: {results.total_frames}")
            print(f"  Unique CAN IDs: {results.unique_can_ids}")
            print(f"  Decoded messages: {results.decoded_frames}")
            print(f"  Processing time: {results.execution_time:.3f}s\n")
            
            rule_anomalies = [a for a in results.anomalies if getattr(a, "is_rule_violation", False)]
            dl_anomalies = [a for a in results.anomalies if getattr(a, "dl_score", None) is not None and a.dl_score >= 0.5]
            
            print("Rule-based detection:")
            print(f"  anomaly count: {len(rule_anomalies)}")
            if rule_anomalies:
                r_types = set()
                r_sevs = {}
                for a in rule_anomalies:
                    if getattr(a, "rule_evidence", None):
                        r_types.update(a.rule_evidence)
                    r_sevs[a.severity] = r_sevs.get(a.severity, 0) + 1
                print("  anomaly types:")
                for rt in list(r_types)[:5]: # show a few
                    print(f"    - {rt}")
                print("  severity distribution:")
                for k, v in r_sevs.items():
                    print(f"    {k}: {v}")
            print()
            
            print("DL detection:")
            print(f"  windows evaluated: {max(0, results.total_frames - 15)}")
            print(f"  anomaly count: {len(dl_anomalies)}")
            if dl_anomalies:
                avg_conf = sum(a.dl_score for a in dl_anomalies) / len(dl_anomalies)
                print(f"  anomaly score/confidence: avg {avg_conf:.2f}")
            print("  inference time: N/A\n")
            
            print("Hybrid detection:")
            print(f"  final anomaly incident count: {len(results.incidents)}")
            if results.incidents:
                h_sevs = {}
                for inc in results.incidents:
                    h_sevs[inc.severity] = h_sevs.get(inc.severity, 0) + 1
                print("  severity distribution:")
                for k, v in h_sevs.items():
                    print(f"    {k}: {v}")
            print()
            
            if results.incidents:
                print("For each final anomaly incident display:")
                for inc in results.incidents:
                    print(f"  {inc.primary_anomaly_type}")
                    print(f"    Start: {inc.start_time:.3f}s")
                    print(f"    End: {inc.end_time:.3f}s")
                    print(f"    Duration: {inc.duration:.3f}s")
                    print(f"    Affected CAN IDs: {', '.join(f'0x{cid:03X}' for cid in inc.affected_can_ids)}")
                    print(f"    Occurrences: {inc.occurrences}")
                    print(f"    Severity: {inc.severity}")
                    print(f"    Evidence: {inc.description}")
                    if inc.peak_dl_score:
                        print(f"    Peak DL score: {inc.peak_dl_score:.4f}")
                    if inc.all_rule_evidence:
                        print(f"    Rule evidence: {', '.join(inc.all_rule_evidence)}")
                    print()
                
        if getattr(args, "json", None):
            with open(args.json, 'w') as f:
                json_results = results.model_dump()
                json.dump(json_results, f, indent=2)
            if not getattr(args, "quiet", False):
                print(f"Results saved to {args.json}")
            
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
