import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, IconButton, Typography,
  TextField, Button, Alert, CircularProgress, Paper,
} from '@mui/material';
import { ArrowBack, Check } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const COLOR_PALETTE = [
  '#E91E63', '#F44336', '#FF5722', '#FF9800',
  '#FFC107', '#8BC34A', '#4CAF50', '#009688',
  '#00BCD4', '#2196F3', '#1565C0', '#3F51B5',
  '#9C27B0', '#795548', '#607D8B', '#546E7A',
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [color, setColor] = useState(profile?.color ?? '#2196F3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const isDirty = displayName !== profile?.display_name || color !== profile?.color;

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile({ display_name: displayName.trim(), color });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => navigate('/groups')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Profile
          </Typography>
          <Button
            color="inherit"
            onClick={handleSave}
            disabled={loading || !isDirty || !displayName.trim()}
            sx={{ fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, maxWidth: 480, mx: 'auto', width: '100%' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {saved && <Alert severity="success" sx={{ mb: 2 }}>Profile updated!</Alert>}

        {/* Name */}
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
            DISPLAY NAME
          </Typography>
          <TextField
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
            fullWidth
            placeholder="Your name"
            inputProps={{ maxLength: 40 }}
          />
        </Paper>

        {/* Color */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 0.5 }}>
            PIN COLOR
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
            Your pins and filter chip will use this color
          </Typography>

          {/* Preview */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: '50%',
                bgcolor: color,
                border: '3px solid white',
                boxShadow: '0 0 0 2px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" fontWeight={600}>
              {displayName || 'Your Name'}
            </Typography>
          </Box>

          {/* Swatches */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 1 }}>
            {COLOR_PALETTE.map((c) => (
              <Box
                key={c}
                onClick={() => { setColor(c); setSaved(false); }}
                sx={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  bgcolor: c,
                  cursor: 'pointer',
                  border: c === color ? '3px solid white' : '3px solid transparent',
                  boxShadow: c === color ? `0 0 0 2px ${c}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              >
                {c === color && <Check sx={{ color: 'white', fontSize: 16 }} />}
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
