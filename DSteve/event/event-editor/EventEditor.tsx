import { Controller, useForm } from 'react-hook-form';

import { Box, MenuItem, TextField, Typography } from '@mui/material';

type EventFormData = {
  eventType: string;
};

export const EventEditor = () => {
  const { control } = useForm<EventFormData>({
    defaultValues: {
      eventType: '',
    },
  });

  const eventTypes = [
    {
      value: 'FOOTBALL',
      label: 'Футбол',
    },
    {
      value: 'BASKETBALL',
      label: 'Баскетбол',
    },
    {
      value: 'VOLLEYBALL',
      label: 'Волейбол',
    },
    {
      value: 'TENNIS',
      label: 'Теннис',
    },
  ];

  return (
    <Box>
      <Typography>Редактировать событие</Typography>
      <Box>
        <Box></Box>
        <Box>
          <button></button>
          <button></button>
        </Box>
      </Box>
      <Box
        sx={{
          m: 3,
        }}
      >
        <Box
          component='form'
          sx={{
            '& .MuiTextField-root': { width: '100%' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
          }}
          noValidate
          autoComplete='off'
        >
          <Controller
            name='eventType'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label='Тип события'
                select
                fullWidth
                helperText='Выберите тип события.'
              >
                {eventTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            id='outlined-helperText'
            label='Название события'
            helperText='Введите название события.'
          />
          <TextField
            id='outlined-helperText'
            label='Место проведения'
            helperText='Укажите место проведения.'
          />

          <TextField
            id='outlined-helperText'
            type='date'
            label='Дата начала события'
            helperText='Укажите дату начала события.'
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
          <TextField
            id='outlined-helperText'
            label='Время начала события'
            helperText='Укажите время начала события.'
            type='label'
            slotProps={{
              input: {
                inputMode: 'numeric',
                pattern: '[0-9]{2}/[0-9]{2}/[0-9]{4}',
                maxLength: 10,
              },
              inputLabel: {
                shrink: true,
              },
            }}
          />
          <TextField
            id='outlined-helperText'
            type='date'
            label='Дата окончания события'
            helperText='Укажите дату окончания события.'
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
          <TextField
            id='outlined-helperText'
            label='Время окончания события'
            helperText='Укажите время окончания события.'
          />
          <TextField
            id='outlined-helperText'
            label='Время окончания события'
            helperText='Укажите максимальное число участников.'
          />
          <TextField
            id='outlined-helperText'
            label='Описание'
            helperText='Опишите событие подробнее.'
          />
        </Box>
        <button></button>
        <button></button>
      </Box>
    </Box>
  );
};

EventEditor.displayName = 'EventEditor';
