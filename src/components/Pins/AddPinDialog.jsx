import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Typography, ToggleButton,
  ToggleButtonGroup, CircularProgress, Alert, Divider,
} from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { PIN_COLORS, PIN_EMOJIS } from '../Map/FairgroundsMap';

const PIN_TYPES = [
  { value: 'food',     label: 'Food',     emoji: PIN_EMOJIS.food },
  { value: 'music',    label: 'Music',    emoji: PIN_EMOJIS.music },
  { value: 'activity', label: 'Activity', emoji: PIN_EMOJIS.activity },
  { value: 'show',     label: 'Show',     emoji: PIN_EMOJIS.show },
  { value: 'exhibit',  label: 'Exhibit',  emoji: PIN_EMOJIS.exhibit },
];

const TIME_TYPES = new Set(['music', 'show']);

export default function AddPinDialog({ open, onClose, onAdd }) {
  const [type, setType] = useState('food');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const needsTimes = TIME_TYPES.has(type);

  const reset = () => {
    setType('food');
    setTitle('');
    setNotes('');
    setStartTime(null);
    setEndTime(null);
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (needsTimes && (!startTime || !endTime)) {
      setError('Start and end times are required for shows and music');
      return;
    }
    if (needsTimes && endTime && startTime && dayjs(endTime).isBefore(dayjs(startTime))) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onAdd({
        type,
        title: title.trim(),
        notes: notes.trim() || null,
        start_time: needsTimes && startTime ? dayjs(startTime).toISOString() : null,
        end_time: needsTimes && endTime ? dayjs(endTime).toISOString() : null,
      });
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add Pin</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Pin type selector */}
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              TYPE
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {PIN_TYPES.map((pt) => (
                <Box
                  key={pt.value}
                  onClick={() => setType(pt.value)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: type === pt.value ? PIN_COLORS[pt.value] : 'transparent',
                    bgcolor: type === pt.value ? `${PIN_COLORS[pt.value]}18` : 'action.hover',
                    transition: 'all 0.15s',
                    minWidth: 56,
                  }}
                >
                  <Typography fontSize={22}>{pt.emoji}</Typography>
                  <Typography variant="caption" fontWeight={600} color={type === pt.value ? PIN_COLORS[pt.value] : 'text.secondary'}>
                    {pt.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
                autoFocus
                placeholder={
                  type === 'food' ? 'e.g. Pronto Pups' :
                  type === 'music' ? 'e.g. The Jayhawks' :
                  type === 'show' ? 'e.g. Grandstand Show' :
                  type === 'exhibit' ? 'e.g. Fine Arts' :
                  'e.g. Giant Slide'
                }
              />

              {needsTimes && (
                <>
                  <Divider>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <AccessTime fontSize="small" />
                      <Typography variant="caption">Scheduled Time</Typography>
                    </Box>
                  </Divider>
                  <DateTimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={setStartTime}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                  <DateTimePicker
                    label="End Time"
                    value={endTime}
                    onChange={setEndTime}
                    minDateTime={startTime || undefined}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </>
              )}

              <TextField
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Any details, tips, or reminders..."
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: PIN_COLORS[type], '&:hover': { bgcolor: PIN_COLORS[type], filter: 'brightness(0.9)' } }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Drop Pin'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
}
