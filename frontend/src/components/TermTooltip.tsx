import { useState } from 'react';
import {
  Box, Dialog, DialogContent, DialogTitle, IconButton, Typography,
} from '@mui/material';
import { HelpOutline as HelpIcon, Close as CloseIcon } from '@mui/icons-material';
import { GlossaryEntry } from '../constants/glossary';

interface TermTooltipProps {
  entry: GlossaryEntry;
}

export const TermTooltip = ({ entry }: TermTooltipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        sx={{
          p: 0,
          ml: 0.5,
          color: '#1976D2',
          '&:hover': { color: '#1565C0', bgcolor: 'transparent' },
        }}
      >
        <HelpIcon sx={{ fontSize: 16 }} />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '50%', bgcolor: '#E3F2FD',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HelpIcon sx={{ fontSize: 18, color: '#1976D2' }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
            {entry.term}
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ mb: entry.formula ? 2 : 0, lineHeight: 1.8 }}>
            {entry.description}
          </Typography>
          {entry.formula && (
            <Box sx={{
              bgcolor: '#F5F5F5', borderRadius: 1, px: 2, py: 1.5, mb: entry.example ? 1.5 : 0,
            }}>
              <Typography variant="caption" sx={{ color: '#555', fontFamily: 'monospace', display: 'block' }}>
                {entry.formula}
              </Typography>
            </Box>
          )}
          {entry.example && (
            <Typography variant="caption" color="text.secondary">
              {entry.example}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
