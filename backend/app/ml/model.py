import torch
import torch.nn as nn

class LightweightCanNet(nn.Module):
    def __init__(self, num_features: int, sequence_length: int):
        super(LightweightCanNet, self).__init__()
        
        # 1D CNN to extract local temporal patterns across the window
        # Input shape: (batch, num_features, sequence_length)
        self.conv1 = nn.Conv1d(in_channels=num_features, out_channels=16, kernel_size=3, padding=1)
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool1d(kernel_size=2)
        
        # The sequence length is halved by MaxPool1d
        gru_seq_len = sequence_length // 2
        
        # GRU to memorize sequential context (e.g. silence gaps)
        # Input shape to GRU: (batch, gru_seq_len, 16)
        self.gru = nn.GRU(input_size=16, hidden_size=16, num_layers=1, batch_first=True)
        
        # Classification head
        self.fc = nn.Linear(16, 1)
        
    def forward(self, x):
        # x shape: (batch, sequence_length, num_features)
        
        # Conv1d expects (batch, channels, length)
        x = x.permute(0, 2, 1) 
        
        x = self.conv1(x)
        x = self.relu(x)
        x = self.pool(x)
        
        # GRU expects (batch, seq_len, features)
        x = x.permute(0, 2, 1)
        
        output, hidden = self.gru(x)
        
        # Take the last hidden state from the GRU
        # hidden shape: (num_layers, batch, hidden_size)
        last_hidden = hidden[-1]
        
        # Output logits
        logits = self.fc(last_hidden)
        return logits
        
    def count_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
