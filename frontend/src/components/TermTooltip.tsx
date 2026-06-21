import { useState } from 'react';
import {
  Box, Button, Dialog, DialogContent, IconButton, Typography,
} from '@mui/material';
import { Info as InfoIcon, Close as CloseIcon } from '@mui/icons-material';
import { GlossaryEntry } from '../constants/glossary';

interface TermTooltipProps {
  entry: GlossaryEntry;
}

export const TermTooltip = ({ entry }: TermTooltipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        component="span"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: '#FF6B35',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 700,
          ml: 0.75,
          cursor: 'pointer',
          flexShrink: 0,
          lineHeight: 1,
          userSelect: 'none',
          '&:hover': { bgcolor: '#E65100' },
        }}
      >
        ?
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 3, pt: 3, pb: 2,
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%', bgcolor: '#FFF3EE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <InfoIcon sx={{ fontSize: 20, color: '#FF6B35' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, fontSize: '1.1rem' }}>
            {entry.term}
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, pt: 0, pb: 3 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.9, color: '#333', mb: entry.formula ? 2.5 : 0 }}>
            {entry.description}
          </Typography>

          {entry.formula && (
            <Box sx={{
              bgcolor: '#F5F5F5', borderRadius: 1.5, px: 2.5, py: 2,
              mb: entry.example ? 2 : 0,
            }}>
              <Typography sx={{ fontSize: '0.95rem', color: '#444', fontFamily: 'monospace' }}>
                {entry.formula}
              </Typography>
            </Box>
          )}

          {entry.example && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {entry.example}
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setOpen(false)}
              sx={{
                bgcolor: '#FF6B35', color: '#fff', fontWeight: 700,
                fontSize: '1rem', py: 1.2, borderRadius: 1.5,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#E65100', boxShadow: 'none' },
              }}
            >
              閉じる
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
