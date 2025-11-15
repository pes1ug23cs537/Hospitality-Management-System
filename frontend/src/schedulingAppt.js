import React, { Component, useState, useEffect } from 'react';
import {
  Schedule,
} from 'grommet-icons';
import {
  Box,
  Button,
  Heading,
  Form,
  Text,
  TextArea,
  Grommet,
  Calendar,
  DropButton,
  MaskedInput,
  Keyboard,
  Select
} from 'grommet';
import './App.css';
const theme = {
  global: {
    colors: {
      brand: '#000000',
      focus: "#000000",
      active: "#000000",
    },
    font: {
      family: 'Lato',
    },
  },
};
var theDate;
var theTime;
var endTime;
var theConcerns;
var theSymptoms;
var theDoc;
const AppBar = (props) => (
  <Box
    tag='header'
    direction='row'
    align='center'
    justify='between'
    background='brand'
    pad={{ left: 'medium', right: 'small', vertical: 'small' }}
    style={{ zIndex: '1' }}
    {...props} />
);

const DropContent = ({ date: initialDate, time: initialTime, onClose }) => {
  const [date, setDate] = React.useState();
  const [time, setTime] = React.useState("00:00");  // Initialize with default time

  const close = () => {
    theDate = date;
    theTime = time;

    if (!time) {
      window.alert("Please select a valid time");
      return;
    }

    try {
      //time is string, store it as [hour, min]
      let parsedTime = time.split(":");

      //parse hr string to in and add one hour to start hour
      let startHour = parseInt(parsedTime[0], 10);
      if (isNaN(startHour)) {
        throw new Error("Invalid hour format");
      }
      let endHour = startHour + 1;

      //rejoin into string
      endTime = `${endHour}:00`;

      console.log("End time:", endTime);
      console.log("Date:", theDate);
      console.log("Start time:", theTime);
      
      onClose(date || initialDate, time || initialTime);
    } catch (err) {
      console.error("Time parsing error:", err);
      window.alert("Please enter a valid time in HH:MM format");
    }
  };

  return (
    <Box align="center">
      <Calendar
        animate={false}
        date={date || initialDate}
        onSelect={setDate}
        showAdjacentDays={false}
        required
      />
      <Box flex={false} pad="medium" gap="small">
        <Keyboard
          required
          onEnter={event => {
            event.preventDefault(); // so drop doesn't re-open
            close();
          }}
        >
          <MaskedInput
            mask={[
              {
                length: [1, 2],
                options: [
                  "0",
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "10",
                  "11",
                  "12",
                  "13",
                  "14",
                  "15",
                  "16",
                  "17",
                  "18",
                  "19",
                  "20",
                  "21",
                  "22",
                  "23",

                ],
                regexp: /^1[1-2]$|^[0-9]$/,
                placeholder: "hh"
              },
              { fixed: ":" },
              {
                length: 2,
                options: ["00"],
                regexp: /^[0-5][0-9]$|^[0-9]$/,
                placeholder: "mm"
              }
            ]}
            value={time || initialTime}
            name="maskedInput"
            onChange={event => setTime(event.target.value)}
            required
          />
        </Keyboard>
        <Box flex={false}>
          <Button label="Done" onClick={close} color="#00739D" />
        </Box>
      </Box>
    </Box>
  );
};

const DateTimeDropButton = () => {
  const [date, setDate] = React.useState();
  const [time, setTime] = React.useState("");
  const [open, setOpen] = React.useState();

  const onClose = (nextDate, nextTime) => {
    setDate(nextDate);
    setTime(nextTime);
    setOpen(false);
    setTimeout(() => setOpen(undefined), 1);
  };

  return (
    <Grommet theme={theme}>
      <Box align="center" pad="large">
        <DropButton
          open={open}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          dropContent={
            <DropContent date={date} time={time} onClose={onClose} />
          }
        >
          <Box direction="row" gap="small" align="center" pad="small">
            <Text color={date ? undefined : "dark-5"}>
              {date
                ? `${new Date(date).toLocaleDateString()} ${time}`
                : "Select date & time"}
            </Text>
            <Schedule />
          </Box>
        </DropButton>
      </Box>
    </Grommet>
  );
};

const ConcernsTextArea = () => {
  const [value, setValue] = React.useState("");

  const onChange = event => {
    setValue(event.target.value);
    theConcerns = event.target.value;
  };

  return (
    <Grommet theme={theme}>
      <Box
        width="medium"
        height="xsmall"
      >
      <TextArea
        placeholder="Enter your concerns..."
        value={value}
        onChange={onChange}
        fill
        required />
      </Box>
    </Grommet>
  );
};

const SymptomsTextArea = () => {
  const [value, setValue] = React.useState("");

  const onChange = event => {
    setValue(event.target.value);
    theSymptoms = event.target.value;
  };

  return (
    <Grommet theme={theme}>
      <Box
        width="medium"
        height="xsmall"
      >
        <TextArea
          placeholder="Enter your symptoms..."
          value={value}
          onChange={onChange} fill
          required />
      </Box>
    </Grommet>
  );
};

function DoctorsDropdown() {
  const [value, setValue] = useState();
  const [doctorsList, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {    
    fetch("/docInfo")  // Use relative URL
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(res => {
        console.log('Doctors data:', res);
        if (!res.data || !Array.isArray(res.data)) {
          throw new Error('Invalid doctor data received');
        }
        let arr = [];
        res.data.forEach(i => {
          let tmp = `${i.name} (${i.email})`;
          arr.push(tmp);
        });
        setList(arr);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading doctors:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const onChange = event => {
    setValue(event.value);
    let doc = event.value.match(/\((.*)\)/)[1];
    theDoc = doc;
  };

  if (loading) return <Text>Loading doctors...</Text>;
  if (error) return <Text color="status-critical">Error loading doctors: {error}</Text>;
  if (doctorsList.length === 0) return <Text>No doctors available</Text>;

  return (
    <Select
      options={doctorsList}
      value={value}
      placeholder="Select Doctor"
      onChange={onChange}
      fill
      required
    />
  );
}

const NextAvailableSlots = ({ doctor }) => {
  const [nextSlot, setNextSlot] = useState(null);
  
  useEffect(() => {
    if (doctor) {
      fetch(`/nextAvailableSlot?doctor=${doctor}`)
        .then(res => res.json())
        .then(data => setNextSlot(data.data.next_slot));
    }
  }, [doctor]);

  return nextSlot && (
    <Box pad="small" background="light-2" round="small">
      <Text>Next Available: {new Date(nextSlot).toLocaleString()}</Text>
      <Button 
        label="Book This Slot" 
        onClick={() => {
          theDate = new Date(nextSlot);
          theTime = nextSlot.split('T')[1].substring(0,5);
          endTime = (parseInt(theTime.split(':')[0]) + 1) + ':00';
        }}
      />
    </Box>
  );
};

export class SchedulingAppt extends Component {
  state = {
    isLoading: true,
    sessionChecked: false
  };

  componentDidMount() {
    // Check session when component mounts
    fetch("/userInSession")
      .then(res => res.json())
      .then(res => {
        if (!res.email) {
          window.location = "/"; // Redirect to login if no session
        } else {
          this.setState({ sessionChecked: true, isLoading: false });
        }
      })
      .catch(err => {
        console.error("Session check failed:", err);
        window.location = "/";
      });
  }

  render() {
    if (this.state.isLoading) {
      return <Text>Checking session...</Text>;
    }

    return (
      <Grommet theme={theme} full>
        <AppBar>
          <a style={{ color: 'inherit', textDecoration: 'inherit'}} href="/">
            <Heading level='3' margin='none'>HMS</Heading>
          </a>
        </AppBar>
        <Box align="center" pad="small" gap="small">
          <Form
            onSubmit={({ value }) => {
              if (!theDoc || !theTime || !theDate) {
                window.alert('Please fill in all required fields');
                return;
              }

              console.log('Scheduling appointment:', {
                doctor: theDoc,
                time: theTime,
                date: theDate,
                endTime: endTime,
                concerns: theConcerns,
                symptoms: theSymptoms
              });

              let appointmentId;
              
              fetch("/userInSession")
                .then(res => res.json())
                .then(res => {
                  if (!res.email) {
                    throw new Error('Please log in to schedule appointments');
                  }
                  const email_in_use = res.email;
                  
                  return fetch("/genApptUID")
                    .then(res => res.json())
                    .then((idRes) => {
                      appointmentId = idRes.id;
                      console.log('Generated appointment ID:', appointmentId);
                      
                      // Check for conflicts
                      return fetch(`/checkIfApptExists?email=${email_in_use}&startTime=${theTime}&date=${theDate}&docEmail=${theDoc}`)
                        .then(res => res.json())
                        .then(res => {
                          console.log('Conflict check response:', res);
                          
                          if (res.data && res.data.length > 0) {
                            throw new Error('This time slot is already booked for the doctor');
                          }
                          
                          // FIRST: Schedule the appointment (creates the appointment record)
                          return fetch(`/schedule?time=${theTime}&date=${theDate}&id=${appointmentId}&endTime=${endTime}&doc=${encodeURIComponent(theDoc)}`);
                        })
                        .then(res => {
                          if (!res.ok) {
                            return res.json().then(err => {
                              throw new Error(err.error || 'Failed to schedule appointment');
                            });
                          }
                          return res.json();
                        })
                        .then(() => {
                          // SECOND: Add patient to the appointment (now that appointment exists)
                          const cleanConcerns = (theConcerns || '').trim();
                          const cleanSymptoms = (theSymptoms || '').trim();
                          
                          return fetch(`/addToPatientSeeAppt?email=${encodeURIComponent(email_in_use)}&id=${appointmentId}&concerns=${encodeURIComponent(cleanConcerns)}&symptoms=${encodeURIComponent(cleanSymptoms)}`);
                        });
                    });
                })
                .then(res => {
                  if (!res.ok) {
                    return res.json().then(err => {
                      throw new Error(err.error || 'Failed to add patient to appointment');
                    });
                  }
                  return res.json();
                })
                .then((data) => {
                  console.log('Appointment scheduled successfully:', data);
                  window.alert('Appointment scheduled successfully!');
                  window.location = '/Home';
                })
                .catch(err => {
                  console.error('Scheduling failed:', err);
                  window.alert(`Failed to schedule appointment: ${err.message}`);
                });
            }}
          >
            <Box align="center" gap="small">
              <DoctorsDropdown />
              {theDoc && <NextAvailableSlots doctor={theDoc} />}
            </Box>
            <DateTimeDropButton>
            </DateTimeDropButton>
            <ConcernsTextArea />
            <br />
            <SymptomsTextArea />
            <br />
            <Box align="center" pad="small" gap="small">
              <Button
                label="Attempt To Schedule"
                type="submit"
                primary
              />
            </Box>
          </Form>
        </Box>
      </Grommet>
    );
  }
}
export default SchedulingAppt;