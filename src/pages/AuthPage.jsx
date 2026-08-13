import { useState } from 'react';
import {
  Box, Card, CardContent, Tabs, Tab, TextField, Button,
  Typography, Alert, InputAdornment, IconButton, CircularProgress, Divider,
  useTheme,
  Grid,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState(0); // 0 = login, 1 = register
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const theme = useTheme()

  const [form, setForm] = useState({ email: '', password: '', displayName: '' });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConfirmEmail('');
    setLoading(true);
    try {
      if (tab === 0) {
        await signIn(form.email, form.password);
      } else {
        if (!form.displayName.trim()) {
          setError('Display name is required');
          return;
        }
        const result = await signUp(form.email, form.password, form.displayName.trim());
        if (result.needsConfirmation) {
          setConfirmEmail(form.email);
        }
      }
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
          <Grid container alignItems="center" justifyContent="center" sx={{ gap: 2 }}>
            <Grid item xs="auto">
              <img src="public/icons/on_a_stick_logo.svg" height="56" width="56" />
            </Grid>
            <Grid item xs="auto" sx={{ textAlign: 'center', mb: 1 }}>
              <Typography variant="h5" fontWeight={700} color="primary">
                On a Stick
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Plan your group outing
              </Typography>
            </Grid>
          </Grid>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); setConfirmEmail(''); }} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab label="Sign In" />
            <Tab label="Create Account" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {confirmEmail && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Account created! Check <strong>{confirmEmail}</strong> for a confirmation link, then sign in.
            </Alert>
          )}

          {/* Google sign-in */}
          <Button
            fullWidth
            variant="outlined"
            onClick={async () => {
              setGoogleLoading(true);
              setError('');
              try { await signInWithGoogle(); }
              catch (err) { setError(err.message); setGoogleLoading(false); }
            }}
            disabled={googleLoading || loading}
            sx={{
              mb: 2,
              py: 1.25,
              borderColor: '#dadce0',
              color: 'text.primary',
              bgcolor: 'white',
              '&:hover': { bgcolor: '#f8f9fa', borderColor: '#dadce0' },
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
            startIcon={
              googleLoading ? <CircularProgress size={18} /> : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
              )
            }
          >
            Continue with Google
          </Button>

          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">or</Typography>
          </Divider>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {tab === 1 && (
                <TextField
                  label="Display Name"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="name"
                  placeholder="How others will see you"
                />
              )}
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="email"
              />
              <TextField
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
                autoComplete={tab === 0 ? 'current-password' : 'new-password'}
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
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ mt: 1, py: 1.5 }}
              >
                {loading
                  ? <CircularProgress size={24} color="inherit" />
                  : tab === 0 ? 'Sign In' : 'Create Account'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
