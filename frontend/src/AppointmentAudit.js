import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  DataTable,
  Text
} from 'grommet';

const AppointmentAudit = () => {
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    fetch('/getAppointmentAudit')
      .then(res => res.json())
      .then(data => setAuditLog(data.data));
  }, []);

  const columns = [
    { property: 'action_date', header: 'Date', render: datum => new Date(datum.action_date).toLocaleString() },
    { property: 'appointment_id', header: 'Appointment' },
    { property: 'user_email', header: 'Changed By' },
    { property: 'old_status', header: 'From' },
    { property: 'new_status', header: 'To' }
  ];

  return (
    <Box pad="medium">
      <Heading level={2}>Appointment Changes History</Heading>
      <DataTable columns={columns} data={auditLog} />
    </Box>
  );
};

export default AppointmentAudit;
