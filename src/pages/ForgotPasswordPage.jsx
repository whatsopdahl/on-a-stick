import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, CircularProgress, useTheme, Link,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
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
            Reset your password
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5} mb={3}>
            Enter your email and we'll send you a link to reset your password.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {sent && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Check <strong>{email}</strong> for a link to reset your password.
            </Alert>
          )}

          {!sent && (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  fullWidth
                  autoComplete="email"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send reset link'}
                </Button>
              </Box>
            </form>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link component={RouterLink} to="/auth" variant="body2" underline="hover">
              Back to sign in
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
