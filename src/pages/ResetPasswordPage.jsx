import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, InputAdornment, IconButton, CircularProgress, useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/groups', { replace: true }), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700} color="primary" textAlign="center">
            Set a new password
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5} mb={3}>
            Choose a new password for your account.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {done && <Alert severity="success" sx={{ mb: 2 }}>Password updated! Redirecting...</Alert>}

          {!done && (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  fullWidth
                  autoComplete="new-password"
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm new password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                  fullWidth
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Update password'}
                </Button>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
