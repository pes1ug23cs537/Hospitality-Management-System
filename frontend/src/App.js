import React,{useEffect, useState} from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import Home from './Home';
import LogIn from './logIn.js';
import CreateAccount from './CreateAccount.js';
import SchedulingAppt from './schedulingAppt.js';
import ViewMedHist from './ViewMedHist.js';
import DocHome from './DocHome.js';
import ViewOneHistory from './ViewOneHistory.js';
import Settings from './Settings.js';
import DocSettings from './DocSettings.js';
import PatientsViewAppt from './PatientsViewAppt.js';
import NoMedHistFound from './NoMedHistFound.js';
import DocViewAppt from './DocViewAppt.js';
import MakeDoc from './MakeDoc.js';
import Diagnose from './Diagnose.js';
import ShowDiagnoses from './ShowDiagnoses.js';
import DoctorSchedule from './DoctorSchedule';
import AppointmentAudit from './AppointmentAudit';

export default function App() {
  let [component, setComponent] = useState(<LogIn />)
  useEffect(()=>{
    fetch('/userInSession')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
        return res.json();
      })
      .then(data => {
        try {
          let email = data.email || "";
          let who = data.who || "";
          if(email === ""){
            setComponent(<LogIn />)
          }
          else{
            if(who==="pat"){
              setComponent(<Home />)
            }
            else{
              setComponent(<DocHome />)
            }
          }
        } catch (e) {
          console.error('Failed to parse /userInSession response', e);
        }
      })
      .catch(err => {
        console.warn('Could not reach backend /userInSession:', err.message || err);
      });
  }, [])
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/NoMedHistFound">
            <NoMedHistFound />
          </Route>
          <Route path="/MakeDoc">
            <MakeDoc />
          </Route>
          <Route path="/Settings">
            <Settings />
          </Route>
          <Route path="/MedHistView">
            <ViewMedHist />
          </Route>
          <Route path="/scheduleAppt">
            <SchedulingAppt />
          </Route>
          <Route path="/showDiagnoses/:id" render={props=><ShowDiagnoses {...props} />} />
          <Route path="/Diagnose/:id" render={props=><Diagnose {...props} />} />
          <Route name="onehist" path="/ViewOneHistory/:email" render={props=><ViewOneHistory {...props} />}/>
          <Route path="/Home">
            <Home />
          </Route>
          <Route path="/createAcc">
            <CreateAccount />
          </Route>
          <Route path="/DocHome">
            <DocHome />
          </Route>
          <Route path="/PatientsViewAppt">
            <PatientsViewAppt />
          </Route>
          <Route path="/DocSettings">
            <DocSettings />
          </Route>
          <Route path="/ApptList">
            <DocViewAppt />
          </Route>
          <Route path="/DoctorSchedule">
            <DoctorSchedule />
          </Route>
          <Route path="/AppointmentAudit">
            <AppointmentAudit />
          </Route>
          <Route path="/">
            {component}
          </Route>
        </Switch>
      </div>
    </Router>
  );
}