import React, { Component } from "react";
import {
  Form,
  FormGroup,
  ControlLabel,
  FormControl,
  Button,
  Alert,
  Grid
} from "react-bootstrap";
import moment from "moment";
import signIn from "../../util/reports/signIn";
import campPhotos from "../../util/reports/campPhotos";
import fairfaxCampData from "../../util/reports/fairfaxCampData";
import customReport from "../../util/reports/customReport";

// import { streamSeasons, streamSessions } from '../../util/reports/data';
const reportMap = {
  signIn,
  campPhotos,
  fairfaxCampData,
  customReport
};

class ReportDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: moment().format("YYYY-MM-DD"),
      endDate: moment().format("YYYY-MM-DD"),
      loading: false,
      currentReport: "signIn"
    };
  }

  runReport = (reportName, startDate, endDate) => {
    this.setState({ err: null });
    this.toggleLoading();
    reportMap[reportName](startDate, endDate)
      .stopOnError(err => {
        console.log(err);
        this.setState({ err });
      })
      .done(() => this.toggleLoading());
  };

  toggleLoading = () => this.setState({ loading: !this.state.loading });

  changeKey = keyName => e => this.setState({ [`${keyName}`]: e.target.value });
  changeDate = keyName => e =>
    this.setState({
      [`${keyName}`]: moment(e.target.value).format("YYYY-MM-DD")
    });

  render() {
    return (
      <Grid>
        {this.state.err && (
          <Alert bsStyle="danger">{this.state.err.message}</Alert>
        )}
        <Form inline>
          <FormGroup>
            <ControlLabel>Report Name</ControlLabel>{" "}
            <FormControl
              componentClass="select"
              value={this.state.currentReport}
              onChange={this.changeKey("currentReport")}
            >
              <option value="signIn">Sign In Sheets</option>
              <option value="campPhotos">Camp Photos</option>
              <option value="fairfaxCampData">Fairfax Camp Data</option>
              <option value="customReport">Custom Report</option>
            </FormControl>{" "}
            <ControlLabel>Start Date</ControlLabel>{" "}
            <FormControl
              type="Date"
              value={this.state.startDate}
              onChange={this.changeDate("startDate")}
            />{" "}
            <ControlLabel>End Date</ControlLabel>{" "}
            <FormControl
              type="Date"
              value={this.state.endDate}
              onChange={this.changeDate("endDate")}
            />
          </FormGroup>{" "}
          <Button
            disabled={this.state.loading}
            bsStyle={this.state.loading ? "warning" : "success"}
            onClick={() =>
              this.runReport(
                this.state.currentReport,
                this.state.startDate,
                this.state.endDate
              )
            }
          >
            Run Reports
          </Button>
        </Form>
      </Grid>
    );
  }
}

export default ReportDashboard;
