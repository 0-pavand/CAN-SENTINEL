import numpy as np
from typing import Tuple

def split_dataset_sequentially(X: np.ndarray, y: np.ndarray, train_ratio: float = 0.7, val_ratio: float = 0.15) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Splits the dataset sequentially to avoid temporal leakage.
    Returns: X_train, y_train, X_val, y_val, X_test, y_test
    """
    n_samples = len(X)
    
    if n_samples == 0:
        return X, y, X, y, X, y
        
    train_end = int(n_samples * train_ratio)
    val_end = int(n_samples * (train_ratio + val_ratio))
    
    X_train, y_train = X[:train_end], y[:train_end]
    X_val, y_val = X[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X[val_end:], y[val_end:]
    
    return X_train, y_train, X_val, y_val, X_test, y_test

def save_dataset(filepath: str, X_train, y_train, X_val, y_val, X_test, y_test):
    """
    Saves the splits into a single compressed NPZ file.
    """
    np.savez_compressed(
        filepath,
        X_train=X_train, y_train=y_train,
        X_val=X_val, y_val=y_val,
        X_test=X_test, y_test=y_test
    )
