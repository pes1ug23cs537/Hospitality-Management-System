import React, { useState, useEffect } from 'react';
import {
  Box,
  Calendar,
  Grid,
  Text,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from 'grommet';

const LoadingSpinner = () => (
  <Box align="center" justify="center" pad="large">
    <Box
      animation="rotateRight"
      border={{ color: 'brand', size: 'medium' }}
      round="full"
      pad="small"
      margin={{ bottom: 'small' }}
    />
    <Text>Loading schedule...</Text>
  </Box>
);

const DoctorSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  const formatDate = (date) => {
    if (!date) return '';
    // Ensure we're working with a date string in YYYY-MM-DD format
    return new Date(date).toISOString().split('T')[0];
  };

  const fetchSchedule = () => {
    setLoading(true);
    fetch(`/getDoctorSchedule?date=${formatDate(selectedDate)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch schedule');
        return res.json();
      })
      .then(data => {
        setSchedule(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching schedule:', err);
        setLoading(false);
      });
  };

  const onDateSelect = (date) => {
    setSelectedDate(formatDate(date));
  };

  return (
    <Box pad="medium" gap="medium">
      <Heading level={2}>Daily Schedule</Heading>
      <Grid columns={['medium', 'auto']} gap="medium">
        <Box>
          <Calendar
            date={selectedDate}
            onSelect={onDateSelect}
            animate={false}
            bounds={['2023-01-01', '2024-12-31']}
          />
        </Box>
        <Box>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell scope="col">Time</TableCell>
                  <TableCell scope="col">Patient</TableCell>
                  <TableCell scope="col">Status</TableCell>
                  <TableCell scope="col">Concerns</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Text textAlign="center">No appointments scheduled</Text>
                    </TableCell>
                  </TableRow>
                ) : (
                  schedule.map((appt, index) => (
                    <TableRow key={index}>
                      <TableCell>{`${appt.starttime?.substring(0,5)}-${appt.endtime?.substring(0,5)}`}</TableCell>
                      <TableCell>{appt.patient_name || 'N/A'}</TableCell>
                      <TableCell>{appt.status || 'N/A'}</TableCell>
                      <TableCell>{appt.concerns || 'None'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Box>
      </Grid>
    </Box>
  );
};

export default DoctorSchedule;
