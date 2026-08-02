import { useState } from 'react';
import {
  Drawer, Box, Typography, Divider, Chip, Avatar,
  Button, IconButton, Stack, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Close, FilterListOff } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { PIN_COLORS, PIN_EMOJIS, AUTHOR_COLORS } from '../Map/FairgroundsMap';

const ALL_TYPES = ['food', 'music', 'activity', 'show', 'exhibit'];

export default function FilterPanel({ open, onClose, filters, onChange, members }) {
  const [localTypes, setLocalTypes] = useState(filters.types);
  const [localAuthors, setLocalAuthors] = useState(filters.authorIds);
  const [localTimeStart, setLocalTimeStart] = useState(filters.timeStart ? dayjs(filters.timeStart) : null);
  const [localTimeEnd, setLocalTimeEnd] = useState(filters.timeEnd ? dayjs(filters.timeEnd) : null);

  // Sync when drawer opens
  const handleOpen = () => {
    setLocalTypes(new Set(filters.types));
    setLocalAuthors(filters.authorIds ? new Set(filters.authorIds) : null);
    setLocalTimeStart(filters.timeStart ? dayjs(filters.timeStart) : null);
    setLocalTimeEnd(filters.timeEnd ? dayjs(filters.timeEnd) : null);
  };

  const toggleType = (type) => {
    const next = new Set(localTypes);
    if (next.has(type)) {
      if (next.size > 1) next.delete(type); // keep at least one
    } else {
      next.add(type);
    }
    setLocalTypes(next);
  };

  const toggleAuthor = (id) => {
    if (!localAuthors) {
      // Currently all — switch to only this one
      setLocalAuthors(new Set([id]));
      return;
    }
    const next = new Set(localAuthors);
    if (next.has(id)) {
      next.delete(id);
      if (next.size === 0) setLocalAuthors(null); // back to all
      else setLocalAuthors(next);
    } else {
      next.add(id);
      if (next.size === members.length) setLocalAuthors(null); // all selected → null
      else setLocalAuthors(next);
    }
  };

  const applyFilters = () => {
    onChange({
      types: localTypes,
      authorIds: localAuthors,
      timeStart: localTimeStart ? localTimeStart.toDate() : null,
      timeEnd: localTimeEnd ? localTimeEnd.toDate() : null,
    });
    onClose();
  };

  const resetFilters = () => {
    const defaults = {
      types: new Set(ALL_TYPES),
      authorIds: null,
      timeStart: null,
      timeEnd: null,
    };
    setLocalTypes(defaults.types);
    setLocalAuthors(null);
    setLocalTimeStart(null);
    setLocalTimeEnd(null);
    onChange(defaults);
  };

  const hasActiveFilters =
    localTypes.size < ALL_TYPES.length ||
    localAuthors !== null ||
    localTimeStart !== null ||
    localTimeEnd !== null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onTransitionEnter={handleOpen}
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80vh' } }}
      >
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          {/* Handle */}
          <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Filters</Typography>
            {hasActiveFilters && (
              <Button size="small" startIcon={<FilterListOff />} onClick={resetFilters} color="warning">
                Reset
              </Button>
            )}
            <IconButton onClick={onClose}><Close /></IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 3, pb: 3, overflow: 'auto' }}>
          {/* Pin Type Filter */}
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
            PIN TYPE
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {ALL_TYPES.map((type) => {
              const selected = localTypes.has(type);
              return (
                <Chip
                  key={type}
                  label={`${PIN_EMOJIS[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                  onClick={() => toggleType(type)}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{
                    bgcolor: selected ? PIN_COLORS[type] : undefined,
                    color: selected ? 'white' : PIN_COLORS[type],
                    borderColor: PIN_COLORS[type],
                    fontWeight: 600,
                    '&:hover': { bgcolor: selected ? PIN_COLORS[type] : `${PIN_COLORS[type]}18` },
                  }}
                />
              );
            })}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Author Filter */}
          {members.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
                ADDED BY
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <Chip
                  label="Everyone"
                  onClick={() => setLocalAuthors(null)}
                  variant={!localAuthors ? 'filled' : 'outlined'}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                {members.map((member, idx) => {
                  const color = AUTHOR_COLORS[idx % AUTHOR_COLORS.length];
                  const selected = !localAuthors || localAuthors.has(member.id);
                  return (
                    <Chip
                      key={member.id}
                      avatar={
                        <Avatar sx={{ bgcolor: `${color} !important`, color: 'white !important', fontSize: '0.65rem' }}>
                          {member.display_name?.[0]?.toUpperCase()}
                        </Avatar>
                      }
                      label={member.display_name}
                      onClick={() => toggleAuthor(member.id)}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{
                        bgcolor: selected ? `${color}22` : undefined,
                        borderColor: color,
                        fontWeight: 600,
                      }}
                    />
                  );
                })}
              </Box>

              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {/* Time Range Filter */}
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 0.5 }}>
            TIME WINDOW
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>
            Shows time-constrained pins (shows & music) within this range
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
            <TimePicker
              label="From"
              value={localTimeStart}
              onChange={setLocalTimeStart}
              slotProps={{ textField: { size: 'small', sx: { flex: 1, minWidth: 120 } } }}
            />
            <TimePicker
              label="Until"
              value={localTimeEnd}
              onChange={setLocalTimeEnd}
              slotProps={{ textField: { size: 'small', sx: { flex: 1, minWidth: 120 } } }}
            />
          </Box>
          {(localTimeStart || localTimeEnd) && (
            <Button size="small" onClick={() => { setLocalTimeStart(null); setLocalTimeEnd(null); }}>
              Clear time filter
            </Button>
          )}
        </Box>

        <Box sx={{ px: 3, pb: 3, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="contained" fullWidth size="large" onClick={applyFilters}>
            Apply Filters
          </Button>
        </Box>
      </Drawer>
    </LocalizationProvider>
  );
}
