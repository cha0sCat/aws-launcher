//React Components
import React, {useEffect, useMemo, useState} from "react";

//Next Components
import Image from 'next/image'

//MaterialUI Components
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import Input from '@mui/material/Input';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import {Autocomplete} from "@mui/material";

//MaterialUI Icons
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

//AWS SDK
import AWS from 'aws-sdk';
import ServiceQuotas from "aws-sdk/clients/servicequotas";

// internal
import handleLaunchInstance from '../common/aws/launch-instance';
import {findSystemInfo, SystemInformation} from '../common/aws/launch-instance';
import handleChangeInstanceIP from '../common/aws/change-instance-ip';
import {InstanceTypes} from "../common/aws/instance-types";

//Need Further Investigation
//var ProxyAgent = require('proxy-agent');
var ProxyAgent //This is a placeholder DO NOT USE!


class ApiMode {
  static LOCAL = 1;
  static REMOTE = 2;
  static LOCAL_WITH_PROXY = 3;
  static REMOTE_WITH_PROXY = 4;
}

export default function App() {
  //Environments
  const defaultRemote = process.env.NEXT_PUBLIC_DEFAULT_REMOTE || "/api";

  //Informations
  const regions = [
    {'value': 'us-east-1', 'label': 'US East (N. Virginia)'},
    {'value': 'us-east-2', 'label': 'US East (Ohio)'},
    {'value': 'us-west-1', 'label': 'US West (N. California)'},
    {'value': 'us-west-2', 'label': 'US West (Oregon)'},
    {'value': 'af-south-1', 'label': 'Africa (Cape Town)'},
    {'value': 'ap-east-1', 'label': 'Asia Pacific (Hong Kong)'},
    {'value': 'ap-south-2', 'label': 'Asia Pacific (Hyderabad)'},
    {'value': 'ap-southeast-3', 'label': 'Asia Pacific (Jakarta)'},
    {'value': 'ap-south-1', 'label': 'Asia Pacific (Mumbai)'},
    {'value': 'ap-northeast-3', 'label': 'Asia Pacific (Osaka)'},
    {'value': 'ap-northeast-2', 'label': 'Asia Pacific (Seoul)'},
    {'value': 'ap-southeast-1', 'label': 'Asia Pacific (Singapore)'},
    {'value': 'ap-southeast-2', 'label': 'Asia Pacific (Sydney)'},
    {'value': 'ap-northeast-1', 'label': 'Asia Pacific (Tokyo)'},
    {'value': 'ca-central-1', 'label': 'Canada (Central)'},
    {'value': 'eu-central-1', 'label': 'Europe (Frankfurt)'},
    {'value': 'eu-west-1', 'label': 'Europe (Ireland)'},
    {'value': 'eu-west-2', 'label': 'Europe (London)'},
    {'value': 'eu-south-1', 'label': 'Europe (Milan)'},
    {'value': 'eu-west-3', 'label': 'Europe (Paris)'},
    {'value': 'eu-south-2', 'label': 'Europe (Spain)'},
    {'value': 'eu-north-1', 'label': 'Europe (Stockholm)'},
    {'value': 'eu-central-2', 'label': 'Middle East (Zurich)'},
    {'value': 'me-south-1', 'label': 'Middle East (Bahrain)'},
    {'value': 'me-central-1', 'label': 'Middle East (UAE)'},
    {'value': 'sa-east-1', 'label': 'South America (S??o Paulo)'},
  ]
  const types = InstanceTypes;
  const instanceStates = new Map([[0, "????????????"], [16, "????????????"], [32, "????????????"], [48, "?????????"], [64, "????????????"], [80, "?????????"]]);

  //Credential States
  const [aki, setAki] = useState("");
  const [saki, setSaki] = useState("");
  const [keyFile, setKeyFile] = useState();

  //Mode States
  const [mode, setMode] = useState(ApiMode.LOCAL);
  const [remote, setRemote] = useState(defaultRemote);
  const [proxy, setProxy] = useState("");

  //Configuration States
  const [liRegion, setLiRegion] = useState("");
  const [system, setSystem] = useState("");
  const [type, setType] = useState("");
  const [ami, setAmi] = useState("");
  const [password, setPassword] = useState("");
  const [disk, setDisk] = useState("");
  const [userdata, setUserdata] = useState("")
  const [gqRegion, setGqRegion] = useState("");
  const [ciRegion, setCiRegion] = useState("");

  //Interaction States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogDescription, setDialogDescription] = useState("");
  const [modeTipOpen, setModeTipOpen] = useState(false);
  const [alertLaunchInstanceOpen, setAlertLaunchInstanceOpen] = useState(false);
  const [alertLaunchInstanceTitle, setAlertLaunchInstanceTitle] = useState("");
  const [alertLaunchInstanceDescription, setAlertLaunchInstanceDescription] = useState("");
  const [alertGetQuotaOpen, setAlertGetQuotaOpen] = useState(false);
  const [alertGetQuotaTitle, setAlertGetQuotaTitle] = useState("");
  const [alertGetQuotaDescription, setAlertGetQuotaDescription] = useState("");
  const [alertCheckInstancesOpen, setAlertCheckInstancesOpen] = useState(false);
  const [alertCheckInstancesTitle, setAlertCheckInstancesTitle] = useState("");
  const [alertCheckInstancesDescription, setAlertCheckInstancesDescription] = useState("");

  //Status States
  const [ipInfomation, setIpInfomation] = useState("");
  const [isLaunchingInstance, setIsLaunchingInstance] = useState(false);
  const [isGettingQuota, setIsGettingQuota] = useState(false);
  const [isCheckingInstances, setIsCheckingInstances] = useState(false);
  const [isCheckedInstances, setIsCheckedInstances] = useState(false);
  const [regionOfCheckedInstances, setRegionOfCheckedInstances] = useState("");
  const [idOfGettingWindowsPassword, setIdOfGettingWindowsPassword] = useState("");
  const [idOfInstanceChangingIp, setIdOfInstanceChangingIp] = useState("");
  const [idOfInstanceTerminating, setIdOfInstanceTerminating] = useState("");
  const [isShowAdvancedOptions, setIsShowAdvancedOptions] = useState(false);

  // ?????????????????? systemType
  const systemType = useMemo(() => isShowAdvancedOptions ? 'Unknown' : findSystemInfo(system)?.systemType, [system, isShowAdvancedOptions]);

  // Windows ?????????????????????
  useEffect(() => {systemType === "Windows" && setPassword("")}, [systemType])

  //Data States
  const [instances, setInstances] = useState([]);

  //Interactions
  function showDialog(title, description) {
    setDialogOpen(true);
    setDialogTitle(title);
    setDialogDescription(description);
  }

  function showLaunchInstanceAlert(title, description) {
    setAlertLaunchInstanceOpen(true);
    setAlertLaunchInstanceTitle(title);
    setAlertLaunchInstanceDescription(description);
  }

  function showGetQuotaAlert(title, description) {
    setAlertGetQuotaOpen(true);
    setAlertGetQuotaTitle(title);
    setAlertGetQuotaDescription(description);
  }

  function showCheckInstancesAlert(title, description) {
    setAlertCheckInstancesOpen(true);
    setAlertCheckInstancesTitle(title);
    setAlertCheckInstancesDescription(description);
  }

  //Validations
  function validateDisk() {
    var validDiskTemplate = /^[0-9]*[1-9][0-9]*$/;
    return validDiskTemplate.test(disk);
  }

  function validateRemote() {
    if (remote === "/api") {
      return true;
    }
    var validRemoteTemplate = /^(http|https?:\/\/)/;
    return validRemoteTemplate.test(remote);
  }

  function validateProxy() {
    var validProxyTemplate = /^(http|https|socks|socks(4|5)|pac?:\/\/)/;
    return validProxyTemplate.test(proxy);
  }

  //Operations
  function getIp() {
    if (mode === ApiMode.LOCAL || mode === ApiMode.LOCAL_WITH_PROXY) {
      if (mode === ApiMode.LOCAL_WITH_PROXY) {
        //Use proxy
        //Need Further Investigation
      }
      fetch('https://api.ipify.org?format=json', {
        method: 'GET'
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            setIpInfomation("???????????????IP?????? " + body.ip);
          }
          else {
            setIpInfomation("????????????IP??????");
          }
        });
    }
    else if (mode === ApiMode.REMOTE || mode === ApiMode.REMOTE_WITH_PROXY) {
      var postBody
      if (mode === ApiMode.REMOTE) {
        postBody = JSON.stringify({});
      }
      else if (mode === ApiMode.REMOTE_WITH_PROXY) {
        postBody = JSON.stringify({
          useProxy: true,
          proxy: proxy
        });
      }
      fetch(remote + '/get-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: postBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            setIpInfomation("???????????????IP?????? " + body.ip);
          }
          else {
            setIpInfomation("????????????IP??????");
          }
        });
    }
  }

  function launchInstance() {
    setIsLaunchingInstance(true);
    if (aki.length !== 20 || saki.length !== 40) {
      showDialog("????????????", "?????????????????????????????????");
      setIsLaunchingInstance(false);
      return;
    }
    if (liRegion === "") {
      showDialog("????????????", "??????????????????????????????");
      setIsLaunchingInstance(false);
      return;
    }
    if (!isShowAdvancedOptions && system === "") {
      showDialog("??????????????????", "????????????????????????????????????");
      setIsLaunchingInstance(false);
      return;
    }
    if (type === "") {
      showDialog("??????????????????", "????????????????????????????????????");
      setIsLaunchingInstance(false);
      return;
    }
    if (password.length < 6 && systemType === "Linux" && !isShowAdvancedOptions) {
      showDialog("????????????", "?????????6??????????????????????????????");
      setIsLaunchingInstance(false);
      return;
    }
    if (!validateDisk()) {
      showDialog("??????????????????", "?????????????????????????????????????????????");
      setIsLaunchingInstance(false);
      return;
    }
    if ((mode === ApiMode.REMOTE || mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateRemote()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIsLaunchingInstance(false);
      return;
    }
    if ((mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateProxy()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIsLaunchingInstance(false);
      return;
    }

    let instanceConfig = {
      InstanceType: type,
      VolumeSize: parseInt(disk),
    }

    if (isShowAdvancedOptions) {
      instanceConfig = {...instanceConfig, ami, userData: userdata}
    } else {
      instanceConfig = {...instanceConfig, system, password}
    }

    if (mode === ApiMode.LOCAL || mode === ApiMode.LOCAL_WITH_PROXY) {
      const awsConfig = new AWS.Config({
        accessKeyId: aki,
        secretAccessKey: saki,
        region: liRegion
      });
      if (mode === ApiMode.LOCAL_WITH_PROXY) {
        awsConfig.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }

      handleLaunchInstance(awsConfig, instanceConfig)
        .then((instanceInfo) => {
          showLaunchInstanceAlert("??????????????????", "???????????????id???" + instanceInfo.instanceId + "????????????????????????????????????????????????ip");
          setInstances([]);
          if (instanceInfo.systemType === "Windows") {
            const blob = new Blob([instanceInfo.KeyMaterial], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = "key.pem";
            link.href = url;
            link.click();
          }
        })
        .catch(err => showDialog("?????????????????????" + err.name, "?????????" + err.message + " ??????????????????????????????"))
        .finally(() => setIsLaunchingInstance(false))

    } else if (mode === ApiMode.REMOTE || mode === ApiMode.REMOTE_WITH_PROXY) {
      const postBody = JSON.stringify({
        aki: aki,
        saki: saki,
        region: liRegion,
        ...instanceConfig,
        useProxy: mode === ApiMode.REMOTE_WITH_PROXY,
        proxy: proxy
      })

      fetch(remote + '/aws-launch-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: postBody
      })
        .then(async (response) => {
          const body = await response.json();
          if (response.ok) {
            showLaunchInstanceAlert("??????????????????", "???????????????id???" + body.instanceId + "????????????????????????????????????????????????ip");
            setInstances([]);

            if (body.systemType === "Windows") {
              const blob = new Blob([body.KeyMaterial], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = "key.pem";
              link.href = url;
              link.click();
            }
          } else {
            showDialog("?????????????????????" + body.error.name, "?????????" + body.error.message + " ??????????????????????????????");
          }
        })
        .catch(err => {
          showDialog("??????????????????", "?????????" + err.message + " ??????????????????????????????");
        })
        .finally(() => setIsLaunchingInstance(false));
    }
  }

  function getQuota() {
    setIsGettingQuota(true);
    if (aki.length !== 20 || saki.length !== 40) {
      showDialog("????????????", "?????????????????????????????????");
      setIsGettingQuota(false);
      return;
    }
    if (gqRegion === "") {
      showDialog("????????????", "??????????????????????????????");
      setIsGettingQuota(false);
      return;
    }
    if ((mode === ApiMode.REMOTE || mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateRemote()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIsGettingQuota(false);
      return;
    }
    if ((mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateProxy()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIsGettingQuota(false);
      return;
    }
    if (mode === ApiMode.LOCAL || mode === ApiMode.LOCAL_WITH_PROXY) {
      AWS.config = new AWS.Config();
      AWS.config.update(
        {
          accessKeyId: aki,
          secretAccessKey: saki,
          region: gqRegion
        }
      );
      if (mode === ApiMode.LOCAL_WITH_PROXY) {
        AWS.config.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }
      var servicequotas = new AWS.ServiceQuotas();
      var params = {
        QuotaCode: 'L-1216C47A',
        ServiceCode: 'ec2'
      };
      servicequotas.getServiceQuota(params, function (err, data) {
        if (err) {
          showDialog("?????????????????????" + err.name, "?????????" + err.message + " ??????????????????????????????");
          setIsGettingQuota(false);
        }
        else {
          showGetQuotaAlert("??????????????????", "???????????????????????????" + String(data.Quota.Value));
          setIsGettingQuota(false);
        }
      });
    }
    else if (mode === ApiMode.REMOTE || mode === ApiMode.REMOTE_WITH_PROXY) {
      var postBody
      if (mode === ApiMode.REMOTE) {
        postBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: gqRegion,
          useProxy: false
        });
      }
      else if (mode === ApiMode.REMOTE_WITH_PROXY) {
        postBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: gqRegion,
          useProxy: true,
          proxy: proxy
        });
      }
      fetch(remote + '/aws-get-quota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: postBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            showGetQuotaAlert("??????????????????", "???????????????????????????" + String(body.quota));
            setIsGettingQuota(false);
          }
          else {
            showDialog("?????????????????????" + body.error.name, "?????????" + body.error.message + " ??????????????????????????????");
            setIsGettingQuota(false);
          }
        });
    }
  }

  function checkInstances(noSuccessAlert) {
    setIsCheckingInstances(true);
    setIsCheckedInstances(false);
    setRegionOfCheckedInstances("");
    if (aki.length !== 20 || saki.length !== 40) {
      showDialog("????????????", "?????????????????????????????????");
      setIsCheckingInstances(false);
      return;
    }
    if (ciRegion === "") {
      showDialog("????????????", "??????????????????????????????");
      setIsCheckingInstances(false);
      return;
    }
    if ((mode === ApiMode.REMOTE || mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateRemote()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIsCheckingInstances(false);
      return;
    }
    if ((mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateProxy()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIsCheckingInstances(false);
      return;
    }
    if (mode === ApiMode.LOCAL || mode === ApiMode.LOCAL_WITH_PROXY) {
      AWS.config = new AWS.Config();
      AWS.config.update(
        {
          accessKeyId: aki,
          secretAccessKey: saki,
          region: ciRegion
        }
      );
      if (mode === ApiMode.LOCAL_WITH_PROXY) {
        AWS.config.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }
      var ec2 = new AWS.EC2();
      var params = {}
      ec2.describeInstances(params, function (err, data) {
        if (err) {
          showDialog("?????????????????????????????????" + err.name, "?????????" + err.message + " ??????????????????????????????");
          setIsCheckingInstances(false);
        }
        else {
          var processedInstances = []
          data.Reservations.forEach(reservation => {
            reservation.Instances.forEach(instance => {
              processedInstances.push({ id: instance.InstanceId, state: instance.State.Code, type: instance.InstanceType, ip: instance.PublicIpAddress, platform: instance.PlatformDetails })
            })
          })
          setInstances(processedInstances);
          if (!noSuccessAlert) {
            showCheckInstancesAlert("??????????????????????????????", "??????????????????????????????????????????????????????????????????????????????");
          }
          setIsCheckingInstances(false);
          setIsCheckedInstances(true);
          setRegionOfCheckedInstances(ciRegion);
        }
      });
    }
    else if (mode === ApiMode.REMOTE || mode === ApiMode.REMOTE_WITH_PROXY) {
      var postBody
      if (mode === ApiMode.REMOTE) {
        postBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: ciRegion,
          useProxy: false
        });
      }
      else if (mode === ApiMode.REMOTE_WITH_PROXY) {
        postBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: ciRegion,
          useProxy: true,
          proxy: proxy
        });
      }
      fetch(remote + '/aws-check-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: postBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            setInstances(body.instances);
            if (!noSuccessAlert) {
              showCheckInstancesAlert("??????????????????????????????", "??????????????????????????????????????????????????????????????????????????????");
            }
            setIsCheckingInstances(false);
            setIsCheckedInstances(true);
            setRegionOfCheckedInstances(ciRegion);
          }
          else {
            showDialog("?????????????????????????????????" + body.error.name, "?????????" + body.error.message + " ??????????????????????????????");
            setIsCheckingInstances(false);
          }
        });
    }
  }

  function getWindowsPassword(id) {
    setIdOfGettingWindowsPassword(id);
    if (keyFile == undefined) {
      showDialog("??????????????????", "????????????????????????????????????");
      setIdOfGettingWindowsPassword("");
      return;
    }
    var fileReader = new FileReader();
    fileReader.onload = async function (e) {
      const JSEncrypt = (await import('jsencrypt')).default;
      var decrypt = new JSEncrypt();
      decrypt.setPrivateKey(e.target.result);
      if (mode === ApiMode.LOCAL || mode === ApiMode.LOCAL_WITH_PROXY) {
        AWS.config = new AWS.Config();
        AWS.config.update(
          {
            accessKeyId: aki,
            secretAccessKey: saki,
            region: regionOfCheckedInstances
          }
        );
        if (mode === ApiMode.LOCAL_WITH_PROXY) {
          AWS.config.update({
            httpOptions: { agent: ProxyAgent(proxy) }
          });
        }
        var ec2 = new AWS.EC2();

        var params = {
          InstanceId: id
        }

        ec2.getPasswordData(params, function (err, data) {
          if (err) {
            showDialog("?????????????????????" + err.name, "?????????" + err.message + " ??????????????????????????????");
            setIdOfGettingWindowsPassword("");
            return;
          }
          if (data.PasswordData == "") {
            showDialog("??????????????????????????????????????????", "?????????15????????????????????????");
            setIdOfGettingWindowsPassword("");
            return;
          }
          var uncrypted = decrypt.decrypt(data.PasswordData);
          if (uncrypted.length !== 32) {
            showDialog("??????????????????", "?????????????????????????????????????????????");
            setIdOfGettingWindowsPassword("");
            return;
          }
          showCheckInstancesAlert("??????????????????", "Administrator???????????????" + uncrypted);
          setIdOfGettingWindowsPassword("");
        });
      }
      else if (mode === ApiMode.REMOTE || mode === ApiMode.REMOTE_WITH_PROXY) {
        var postBody
        if (mode === ApiMode.REMOTE) {
          postBody = JSON.stringify({
            aki: aki,
            saki: saki,
            instanceId: id,
            region: regionOfCheckedInstances,
            useProxy: false
          });
        }
        else if (mode === ApiMode.REMOTE_WITH_PROXY) {
          postBody = JSON.stringify({
            aki: aki,
            saki: saki,
            instanceId: id,
            region: regionOfCheckedInstances,
            useProxy: true,
            proxy: proxy
          });
        }
        fetch(remote + '/aws-get-windows-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: postBody
        })
          .then(async (response) => {
            var body = await response.json();
            if (response.ok) {
              var uncrypted = decrypt.decrypt(body.PasswordData);
              if (uncrypted === null) {
                showDialog("??????????????????", "?????????????????????????????????????????????");
                setIdOfGettingWindowsPassword("");
                return;
              }
              if (uncrypted.length !== 32) {
                showDialog("??????????????????", "?????????????????????????????????????????????");
                setIdOfGettingWindowsPassword("");
                return;
              }
              showCheckInstancesAlert("??????????????????", "Administrator???????????????" + uncrypted);
              setIdOfGettingWindowsPassword("");
            }
            else {
              showDialog("?????????????????????" + body.error.name, "?????????" + body.error.message + " ??????????????????????????????");
              setIdOfGettingWindowsPassword("");
            }
          });
      }
    }
    fileReader.readAsText(keyFile);
  }

  function changeInstanceIp(id) {
    setIdOfInstanceChangingIp(id);
    if (aki.length !== 20 || saki.length !== 40) {
      showDialog("????????????", "?????????????????????????????????");
      setIdOfInstanceChangingIp("");
      return;
    }
    if ((mode === ApiMode.REMOTE || mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateRemote()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIdOfInstanceChangingIp("");
      return;
    }
    if ((mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateProxy()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIdOfInstanceChangingIp("");
      return;
    }
    if (mode === ApiMode.LOCAL || mode === ApiMode.LOCAL_WITH_PROXY) {
      const awsConfig = new AWS.Config({
        accessKeyId: aki,
        secretAccessKey: saki,
        region: regionOfCheckedInstances
      });
      if (mode === ApiMode.LOCAL_WITH_PROXY) {
        awsConfig.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }

      handleChangeInstanceIP(awsConfig, {instanceId: id})
        .then(() => {
          showCheckInstancesAlert("????????????ip??????", "?????????????????????????????????ip");
          checkInstances(true);
        })
        .catch(err => showDialog("????????????ip?????????" + err.name, "?????????" + err.message + " ??????????????????????????????"))
        .finally(() => setIdOfInstanceChangingIp(""))
    }
    else if (mode === ApiMode.REMOTE || mode === ApiMode.REMOTE_WITH_PROXY) {
      const postBody = JSON.stringify({
        aki: aki,
        saki: saki,
        region: regionOfCheckedInstances,
        instanceId: id,
        useProxy: mode === ApiMode.REMOTE_WITH_PROXY,
        proxy: proxy
      })

      fetch(remote + '/aws-change-instance-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: postBody
      })
        .then(async (response) => {
          const body = await response.json();
          if (response.ok) {
            showCheckInstancesAlert("????????????ip??????", "?????????????????????????????????ip");
            checkInstances(true);
          }
          else {
            showDialog("????????????ip?????????" + body.err.name, "?????????" + body.err.message + " ??????????????????????????????");
          }
        })
        .finally(() => setIdOfInstanceChangingIp(""))
    }
  }

  function terminateInstance(id) {
    setIdOfInstanceTerminating(id);
    if (aki.length !== 20 || saki.length !== 40) {
      showDialog("????????????", "?????????????????????????????????");
      setIdOfInstanceTerminating("");
      return;
    }
    if ((mode === ApiMode.REMOTE || mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateRemote()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIdOfInstanceTerminating("");
      return;
    }
    if ((mode === ApiMode.LOCAL_WITH_PROXY || mode === ApiMode.REMOTE_WITH_PROXY) && !validateProxy()) {
      showDialog("??????????????????", "??????????????????????????????????????????????????????");
      setIdOfInstanceTerminating("");
      return;
    }
    if (mode === ApiMode.LOCAL || mode === ApiMode.LOCAL_WITH_PROXY) {
      AWS.config = new AWS.Config();
      AWS.config.update(
        {
          accessKeyId: aki,
          secretAccessKey: saki,
          region: regionOfCheckedInstances
        }
      );
      if (mode === ApiMode.LOCAL_WITH_PROXY) {
        AWS.config.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }
      var ec2 = new AWS.EC2();
      var params = {
        InstanceIds: [
          id
        ]
      };
      ec2.terminateInstances(params, function (err, data) {
        if (err) {
          showDialog("?????????????????????" + err.name, "?????????" + err.message + " ??????????????????????????????");
          setIdOfInstanceTerminating("");
        }
        else {
          showCheckInstancesAlert("??????????????????", "??????????????????????????????????????????????????????????????????????????????");
          setIdOfInstanceTerminating("");
          checkInstances(true);
        }
      });
    }
    else if (mode === ApiMode.REMOTE || mode === ApiMode.REMOTE_WITH_PROXY) {
      var postBody
      if (mode === ApiMode.REMOTE) {
        postBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: regionOfCheckedInstances,
          instanceId: id,
          useProxy: false
        });
      }
      else if (mode === ApiMode.REMOTE_WITH_PROXY) {
        postBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: regionOfCheckedInstances,
          instanceId: id,
          useProxy: true,
          proxy: proxy
        });
      }
      fetch(remote + '/aws-terminate-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: postBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            showCheckInstancesAlert("??????????????????", "??????????????????????????????????????????????????????????????????????????????");
            setIdOfInstanceTerminating("");
            checkInstances(true);
          }
          else {
            showDialog("?????????????????????" + body.err.name, "?????????" + body.err.message + "?????????????????????????????????");
            setIdOfInstanceTerminating("");
          }
        });
    }
  }

  return (
    <div className="App">
      <div>
        <Typography id="main-title" sx={{ m: 2 }} variant="h4">Shizuku Launcher - AWS???????????????</Typography>
      </div>
      <div>
        <Stack sx={{ m: 2 }} spacing={2} direction="row">
          <Link underline="hover" variant="body2" href="https://github.com/hiDandelion/shizuku-launcher-next">??????????????????</Link>
        </Stack>
      </div>
      <div>
        <Image src="/title-shizuku.webp" alt="title-shizuku" width={256} height={256} />
      </div>
      <div>
        <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }} variant="standard">
          <TextField label="Access Key ID" variant="outlined" size="small" onChange={(e) => {
            setAki(e.target.value);
            setIsCheckedInstances(false);
          }} />
        </FormControl>
      </div>
      <div>
        <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
          <TextField label="Secret Access Key ID" variant="outlined" size="small" onChange={(e) => {
            setSaki(e.target.value);
            setIsCheckedInstances(false);
          }} />
        </FormControl>
      </div>
      <div>
        <Collapse in={modeTipOpen}>
          <Alert severity="info" onClose={() => { setModeTipOpen(false) }}>
            <AlertTitle>??????????????????</AlertTitle>
            <div>??????????????????????????????????????????????????????????????????AWS????????????</div>
            <br />
            <div>?????????????????????????????????IP???????????????????????????????????????????????????????????????????????????????????????????????????</div>
            <div>????????????????????????????????????????????????????????????<Link underline="hover" href="https://github.com/hiDandelion/shizuku-launcher-next">????????????</Link>????????????????????????????????????????????????????????????</div>
            <br />
            <div>??????+???????????????????????????????????????????????????????????????????????????AWS??????????????????</div>
            <div>????????????????????????????????????????????????????????????????????????http/https/socks(v5)/socks5/socks4/pac</div>
            <div>????????????????????????https://username:password@your-proxy.com:port</div>
            <br />
          </Alert>
        </Collapse>
      </div>
      <div>
        <FormControl sx={{ m: 1 }}>
          <Box>
            <FormLabel id="mode-radio-buttons-group-label">????????????</FormLabel>
            <Button variant="text" size="small" startIcon={<HelpOutlineIcon />} onClick={() => {
              setModeTipOpen(true);
            }}>??????</Button>
          </Box>
          <RadioGroup
            row
            aria-labelledby="mode-radio-buttons-group-label"
            defaultValue={1}
            onChange={e => {
              setMode(parseInt(e.currentTarget.value))
              setIpInfomation("");
            }}
          >
            <FormControlLabel value={1} control={<Radio />} label="??????" />
            <FormControlLabel value={2} control={<Radio />} label="??????" />
            {
              //Uncomment this when proxy-agent is ready to use
              //<FormControlLabel value={3} control={<Radio />} label="??????+????????????????????????" />
            }
            <FormControlLabel value={4} control={<Radio />} label="??????+??????" />

          </RadioGroup>
        </FormControl>
      </div>
      {mode === ApiMode.REMOTE ? (
        <>
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="????????????????????????" variant="outlined" size="small" onChange={(e) => {
                setRemote(e.target.value);
                if (remote === "") {
                  setRemote(defaultRemote)
                }
              }} />
            </FormControl>
          </div>
        </>
      ) : (
        <></>
      )}
      {mode === ApiMode.LOCAL_WITH_PROXY ? (
        <>
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="????????????" variant="outlined" size="small" onChange={(e) => {
                setProxy(e.target.value);
              }} />
            </FormControl>
          </div>
        </>
      ) : (
        <></>
      )}
      {mode === ApiMode.REMOTE_WITH_PROXY ? (
        <>
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="????????????????????????" variant="outlined" size="small" onChange={(e) => {
                setRemote(e.target.value);
                if (remote === "") {
                  setRemote(defaultRemote)
                }
              }} />
            </FormControl>
          </div>
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="????????????" variant="outlined" size="small" onChange={(e) => {
                setProxy(e.target.value);
              }} />
            </FormControl>
          </div>
        </>
      ) : (
        <></>
      )}
      <div>
        {mode === ApiMode.LOCAL ? (
          <Typography sx={{ m: 1 }} variant="subtitle2">?????????????????????????????????????????????IP????????????????????????IP?????????????????????</Typography>
        ) : (
          <></>
        )
        }
        {ipInfomation === "" ? (
          <Button variant="text" size="small" onClick={() => {
            getIp()
          }}>??????IP</Button>
        ) : (
          <Typography sx={{ m: 1 }}>{ipInfomation}</Typography>
        )
        }
      </div>
      <div>
        <FormGroup sx={{ m: 1 }} >
          <FormControlLabel control={<Checkbox size="small" checked={isShowAdvancedOptions} onChange={(e) => {
            setIsShowAdvancedOptions(e.target.checked);
          }} />} label={<Typography variant="subtitle2">????????????</Typography>} />
        </FormGroup>
      </div>
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); }}>OK</Button>
        </DialogActions>
      </Dialog>
      <Divider sx={{ m: 1 }} />
      <Collapse in={alertLaunchInstanceOpen}>
        <Alert severity="success" onClose={() => { setAlertLaunchInstanceOpen(false) }}>
          <AlertTitle>{alertLaunchInstanceTitle}</AlertTitle>
          {alertLaunchInstanceDescription}
        </Alert>
      </Collapse>
      <Typography sx={{ m: 1 }} variant="h6">????????????</Typography>
      <div>
        <FormControl sx={{ m: 1, minWidth: 100 }} size="small">
          <InputLabel id="select-region-label">??????</InputLabel>
          <Select labelId="select-region-label" label="??????" value={liRegion} onChange={e => {
            setLiRegion(e.target.value);
          }}>
            {isShowAdvancedOptions ?
              regions.map((region) =>
                <MenuItem key={region.value} value={region.value}>{region.value}</MenuItem>
              )
              :
              regions.map((region) =>
                <MenuItem key={region.value} value={region.value}>{region.label}</MenuItem>
              )
            }
          </Select>
        </FormControl>
        {isShowAdvancedOptions ? (
          <FormControl sx={{ m: 1, minWidth: 250 }} size="small">
            <TextField label="AMI ID" variant="outlined" size="small" onChange={(e) => {
              setAmi(e.target.value);
            }} value={ami} />
          </FormControl>
        ) : (
          <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
            <InputLabel id="select-system-label">????????????</InputLabel>
            <Select labelId="select-system-label" label="????????????" value={system} onChange={e => {
              setSystem(e.target.value);
            }}>
              {SystemInformation.map(systemInformation =>
                <MenuItem key={systemInformation.name} value={systemInformation.name}>
                  {systemInformation.displayName}
                </MenuItem>
              )}
            </Select>
          </FormControl>
        )}
        {isShowAdvancedOptions ? (
          <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
            <TextField label="????????????" variant="outlined" size="small" onChange={(e) => {
              setType(e.target.value);
            }} />
          </FormControl>
        ) : (
          <FormControl sx={{ m: 1, minWidth: 320 }} size="small">
            <Autocomplete
              id="select-type-label"
              options={types}
              value={type}
              renderInput={(params) => <TextField {...params} label="????????????" />}
              onChange={(e, option) => {setType(option.value)}}
            />
          </FormControl>
        )}
        {systemType === "Linux" && !isShowAdvancedOptions && (
          <div>
            <FormControl sx={{ m: 1, minWidth: 150 }}>
              <TextField label="??????" type="password" variant="outlined" size="small" onChange={(e) => {
                setPassword(e.target.value);
              }} />
            </FormControl>
          </div>
        )}
        <div>
          <FormControl sx={{ m: 1, minWidth: 150 }}>
            <TextField label="???????????????GB???" variant="outlined" size="small" multiline onChange={(e) => {
              setDisk(e.target.value);
            }} />
          </FormControl>
        </div>
        {isShowAdvancedOptions ? (
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="User Data" variant="outlined" size="small" multiline value={userdata} onChange={(e) => {
                setUserdata(e.target.value);
              }} />
            </FormControl>
          </div>
        ) : (
          <></>
        )}
      </div>
      {isLaunchingInstance ? (<CircularProgress sx={{ m: 1 }} />) : (
        <div>
          <FormControl>
            <Button sx={{ m: 1 }} variant="contained" size="small" onClick={() => {
              launchInstance();
            }}>??????</Button>
          </FormControl>
        </div>)}
      <Divider sx={{ m: 1 }} />
      <Collapse in={alertGetQuotaOpen}>
        <Alert severity="success" onClose={() => { setAlertGetQuotaOpen(false) }}>
          <AlertTitle>{alertGetQuotaTitle}</AlertTitle>
          {alertGetQuotaDescription}
        </Alert>
      </Collapse>
      <Typography sx={{ m: 1 }} variant="h6">????????????</Typography>
      <div>
        <FormControl sx={{ m: 1, minWidth: 100 }} size="small">
          <InputLabel id="select-region-label">??????</InputLabel>
          <Select labelId="select-region-label" label="??????" value={gqRegion} onChange={e => {
            setGqRegion(e.target.value);
          }}>
            {isShowAdvancedOptions ?
              regions.map((region) =>
                <MenuItem key={region.value} value={region.value}>{region.value}</MenuItem>
              )
              :
              regions.map((region) =>
                <MenuItem key={region.value} value={region.value}>{region.label}</MenuItem>
              )
            }
          </Select>
        </FormControl>
      </div>
      {isGettingQuota ? (<CircularProgress sx={{ m: 1 }} />) : (
        <div>
          <FormControl>
            <Button sx={{ m: 1 }} variant="contained" size="small" onClick={() => {
              getQuota();
            }}>??????</Button>
          </FormControl>
        </div>
      )}
      <Divider sx={{ m: 1 }} />
      <Collapse in={alertCheckInstancesOpen}>
        <Alert severity="success" onClose={() => { setAlertCheckInstancesOpen(false) }}>
          <AlertTitle>{alertCheckInstancesTitle}</AlertTitle>
          {alertCheckInstancesDescription}
        </Alert>
      </Collapse>
      <Typography sx={{ m: 1 }} variant="h6">????????????????????????</Typography>
      <div>
        <FormControl sx={{ m: 1, minWidth: 100 }} size="small">
          <InputLabel id="select-region-label">??????</InputLabel>
          <Select labelId="select-region-label" label="??????" value={ciRegion} onChange={e => {
            setCiRegion(e.target.value);
          }}>
            {isShowAdvancedOptions ?
              regions.map((region) =>
                <MenuItem key={region.value} value={region.value}>{region.value}</MenuItem>
              )
              :
              regions.map((region) =>
                <MenuItem key={region.value} value={region.value}>{region.label}</MenuItem>
              )
            }
          </Select>
        </FormControl>
      </div>
      {isCheckingInstances ? (<CircularProgress sx={{ m: 1 }} />) : (
        <div>
          <FormControl>
            <Button sx={{ m: 1 }} variant="contained" size="small" onClick={() => {
              checkInstances(false);
            }}>??????</Button>
          </FormControl>
        </div>
      )}
      {isCheckedInstances ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>id</TableCell>
                <TableCell>??????</TableCell>
                <TableCell>??????ip</TableCell>
                <TableCell>????????????</TableCell>
                <TableCell>????????????</TableCell>
                <TableCell>??????</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instances.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{instanceStates.get(row.state)}</TableCell>
                  <TableCell>{row.ip}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.platform}</TableCell>
                  <TableCell>
                    <Box sx={{ '& button': { m: 1 } }}>
                      {idOfGettingWindowsPassword === row.id || idOfInstanceChangingIp === row.id || idOfInstanceTerminating === row.id ? (<CircularProgress />) : (
                        <div>
                          {row.platform == "Windows" ? (
                            <div>
                              <Input type="file" onChange={(e) => {
                                setKeyFile(e.target.files[0]);
                              }}></Input>
                              <Button size="small" variant="outlined" onClick={() => getWindowsPassword(row.id)}>????????????</Button>
                            </div>
                          ) : (
                            <></>
                          )}
                          <Button size="small" variant="outlined" onClick={() => changeInstanceIp(row.id)}>??????ip</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => terminateInstance(row.id)}>??????</Button>
                        </div>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (<></>)}
    </div>
  );
}
