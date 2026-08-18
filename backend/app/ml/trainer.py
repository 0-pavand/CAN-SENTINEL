import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
import numpy as np
import os
import copy
from typing import Dict, Any
from app.ml.model import LightweightCanNet

class ModelTrainer:
    def __init__(self, num_features: int, sequence_length: int, learning_rate: float = 0.001):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = LightweightCanNet(num_features, sequence_length).to(self.device)
        self.criterion = nn.BCEWithLogitsLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        
    def get_parameter_count(self) -> int:
        return self.model.count_parameters()
        
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_val: np.ndarray, y_val: np.ndarray,
              epochs: int = 50, batch_size: int = 8, patience: int = 10,
              model_save_path: str = "models/can_net.pth") -> Dict[str, Any]:
              
        train_tensor = TensorDataset(torch.FloatTensor(X_train), torch.FloatTensor(y_train))
        val_tensor = TensorDataset(torch.FloatTensor(X_val), torch.FloatTensor(y_val))
        
        train_loader = DataLoader(train_tensor, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_tensor, batch_size=batch_size, shuffle=False)
        
        best_val_loss = float('inf')
        best_model_wts = copy.deepcopy(self.model.state_dict())
        epochs_no_improve = 0
        
        history = {"train_loss": [], "val_loss": []}
        
        print(f"Training Model on {self.device} (Parameters: {self.get_parameter_count()})")
        
        for epoch in range(epochs):
            self.model.train()
            train_loss = 0.0
            for batch_X, batch_y in train_loader:
                batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)
                
                self.optimizer.zero_grad()
                logits = self.model(batch_X).squeeze(-1)
                loss = self.criterion(logits, batch_y)
                loss.backward()
                self.optimizer.step()
                
                train_loss += loss.item() * batch_X.size(0)
                
            train_loss = train_loss / len(train_loader.dataset)
            
            # Validation
            self.model.eval()
            val_loss = 0.0
            with torch.no_grad():
                for batch_X, batch_y in val_loader:
                    batch_X, batch_y = batch_X.to(self.device), batch_y.to(self.device)
                    logits = self.model(batch_X).squeeze(-1)
                    loss = self.criterion(logits, batch_y)
                    val_loss += loss.item() * batch_X.size(0)
                    
            val_loss = val_loss / len(val_loader.dataset)
            
            history["train_loss"].append(train_loss)
            history["val_loss"].append(val_loss)
            
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                best_model_wts = copy.deepcopy(self.model.state_dict())
                epochs_no_improve = 0
            else:
                epochs_no_improve += 1
                
            if epochs_no_improve >= patience:
                print(f"Early stopping triggered at epoch {epoch+1}")
                break
                
        # Load best weights and save
        self.model.load_state_dict(best_model_wts)
        os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
        torch.save(self.model.state_dict(), model_save_path)
        print(f"Best model saved to {model_save_path} (Val Loss: {best_val_loss:.4f})")
        
        return history
