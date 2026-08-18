import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Chip, Avatar,
  Divider, CircularProgress, Alert,
  Switch, FormControlLabel, Tooltip,
} from '@mui/material';
import { AccessTime, Delete, Edit, Check, Close } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { PIN_COLORS, PIN_EMOJIS, AUTHOR_COLORS } from '../Map/FairgroundsMap';
import LikeButton from './LikeButton';

const TIME_TYPES = new Set(['music', 'show']);

export default function PinDetailDialog({ pin, members, memberColors, likes, currentUserId, isGroupCreator, open, onClose, onDelete, onUpdate, onToggleComplete, onToggleLike }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStart, setEditStart] = useState(null);
  const [editEnd, setEditEnd] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!pin) return null;

  const isOwner = pin.user_id === currentUserId;
  const canDelete = isOwner || isGroupCreator;
  const needsTimes = TIME_TYPES.has(pin.type);
  const author = members.find((m) => m.id === pin.user_id);
  const authorColor = memberColors[pin.user_id] || AUTHOR_COLORS[0];

  const startEdit = () => {
    setEditTitle(pin.title);
    setEditNotes(pin.notes || '');
    setEditStart(pin.start_time ? dayjs(pin.start_time) : null);
    setEditEnd(pin.end_time ? dayjs(pin.end_time) : null);
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setError(''); };

  const handleSave = async () => {
    if (!editTitle.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onUpdate(pin.id, {
        title: editTitle.trim(),
        notes: editNotes.trim() || null,
        start_time: needsTimes && editStart ? dayjs(editStart).toISOString() : pin.start_time,
        end_time: needsTimes && editEnd ? dayjs(editEnd).toISOString() : pin.end_time,
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      await onToggleComplete(pin.id, !pin.completed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(pin.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setEditing(false); setError(''); onClose(); };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: '50%',
                bgcolor: PIN_COLORS[pin.type],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}
            >
              {PIN_EMOJIS[pin.type]}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <TextField
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  size="small"
                  fullWidth
                  autoFocus
                />
              ) : (
                <Typography fontWeight={700} noWrap>{pin.title}</Typography>
              )}
              <Chip
                label={pin.type.charAt(0).toUpperCase() + pin.type.slice(1)}
                size="small"
                sx={{ bgcolor: `${PIN_COLORS[pin.type]}22`, color: PIN_COLORS[pin.type], fontWeight: 600, mt: 0.25 }}
              />
            </Box>
            <Tooltip title={pin.completed ? 'Mark as incomplete' : 'Mark as complete'}>
              <span>
                <FormControlLabel
                  labelPlacement="top"
                  sx={{ m: 0, flexShrink: 0 }}
                  control={
                    <Switch
                      checked={!!pin.completed}
                      onChange={handleToggleComplete}
                      disabled={loading}
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                      Done
                    </Typography>
                  }
                />
              </span>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

          {/* Author + likes */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: authorColor }}>
                {author?.display_name?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Added by <strong>{author?.display_name ?? 'Unknown'}</strong>
              </Typography>
            </Box>
            <LikeButton
              pin={pin}
              likes={likes}
              members={members}
              currentUserId={currentUserId}
              onToggleLike={onToggleLike}
            />
          </Box>

          {/* Time info */}
          {(pin.start_time || (editing && needsTimes)) && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="caption" fontWeight={600} color="text.secondary">SCHEDULED TIME</Typography>
              </Box>
              {editing && needsTimes ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <DateTimePicker
                    label="Start Time"
                    value={editStart}
                    onChange={setEditStart}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DateTimePicker
                    label="End Time"
                    value={editEnd}
                    onChange={setEditEnd}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Box>
              ) : pin.start_time ? (
                <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
                  <Typography variant="body2">
                    <strong>{dayjs(pin.start_time).format('ddd, MMM D · h:mm A')}</strong>
                    {pin.end_time && ` – ${dayjs(pin.end_time).format('h:mm A')}`}
                  </Typography>
                </Box>
              ) : null}
            </>
          )}

          {/* Notes */}
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            NOTES
          </Typography>
          {editing ? (
            <TextField
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Add notes..."
            />
          ) : pin.notes ? (
            <Typography variant="body2">{pin.notes}</Typography>
          ) : (
            <Typography variant="body2" color="text.disabled" fontStyle="italic">No notes</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {canDelete && !editing && (
            <Button
              color="error"
              startIcon={<Delete />}
              onClick={handleDelete}
              disabled={loading}
              sx={{ mr: 'auto' }}
            >
              {loading ? <CircularProgress size={16} /> : 'Remove'}
            </Button>
          )}
          {isOwner && !editing && (
            <Button startIcon={<Edit />} onClick={startEdit} disabled={loading}>Edit</Button>
          )}
          {editing && (
            <>
              <Button startIcon={<Close />} onClick={cancelEdit}>Cancel</Button>
              <Button variant="contained" startIcon={loading ? null : <Check />} onClick={handleSave} disabled={loading}>
                {loading ? <CircularProgress size={18} color="inherit" /> : 'Save'}
              </Button>
            </>
          )}
          {!editing && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
