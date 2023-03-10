import AWS from 'aws-sdk';

const allowAllIngressRule = [
  {
    FromPort: 0,
    IpProtocol: "tcp",
    IpRanges: [
      {
        CidrIp: "0.0.0.0/0",
        Description: "All TCP"
      }
    ],
    ToPort: 65535
  },
  {
    FromPort: 0,
    IpProtocol: "udp",
    IpRanges: [
      {
        CidrIp: "0.0.0.0/0",
        Description: "All UDP"
      }
    ],
    ToPort: 65535
  },
  {
    FromPort: -1,
    IpProtocol: "icmp",
    IpRanges: [
      {
        CidrIp: "0.0.0.0/0",
        Description: "All ICMP"
      }
    ],
    ToPort: -1
  },
  {
    FromPort: -1,
    IpProtocol: "icmpv6",
    IpRanges: [
      {
        CidrIp: "0.0.0.0/0",
        Description: "All ICMPV6"
      }
    ],
    ToPort: -1
  }
];

export const SystemInformation = [
  {
    "name": "debian-10",
    "displayName": "Debian 10",
    "imageName": "debian-10-amd64-2022*",
    "imageOwner": "136693071363",
    "systemType": "Linux",
  },
  {
    "name": "debian-11",
    "displayName": "Debian 11",
    "imageName": "debian-11-amd64-2022*",
    "imageOwner": "136693071363",
    "systemType": "Linux",
  },
  {
    "name": "ubuntu-20.04",
    "displayName": "Ubuntu 20.04",
    "imageName": "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-2022*",
    "imageOwner": "099720109477",
    "systemType": "Linux",
  },
  {
    "name": "ubuntu-22.04",
    "displayName": "Ubuntu 22.04",
    "imageName": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-2022*",
    "imageOwner": "099720109477",
    "systemType": "Linux",
  },
  {
    "name": "Arch Linux",
    "displayName": "Arch Linux",
    "imageName": "*",
    "imageOwner": "647457786197",
    "systemType": "Linux",
  },
  {
    "name": "windows-server-2022-sc",
    "displayName": "Windows Server 2022 (Chinese Simplified)",
    "imageName": "Windows_Server-2022-Chinese_Simplified-Full-Base-*",
    "imageOwner": "801119661308",
    "systemType": "windows",
  },
  {
    "name": "windows-server-2022-en",
    "displayName": "Windows Server 2022 (English)",
    "imageName": "Windows_Server-2022-English-Full-Base-*",
    "imageOwner": "801119661308",
    "systemType": "windows",
  }
]

/**
 * ????????????????????????????????????
 * @param systemName
 * @return {{imageName: string, displayName: string, name: string, imageOwner: string, systemType: string}}
 */
export function findSystemInfo(systemName) {
  return SystemInformation.find(system => system.name === systemName) ?? {}
}

/**
 *
 * @param awsConfig {AWS.Config}
 * @param instanceConfig {{
 *   system?: string,
 *   ami?: string,
 *   password?: string,
 *   userData?: string,
 *   InstanceType: "t2.nano" || "t2.micro" || string,
 *   VolumeSize: number,
 * }}
 */
export default async function launchInstance(awsConfig, instanceConfig) {
  AWS.config = awsConfig;
  const ec2 = new AWS.EC2();

  let {
    ami,
    system,
    password,
    userData,
    InstanceType,
    VolumeSize,
  } = instanceConfig

  // ??? ami ??????????????? ami
  // ???????????? imageName ??? imageOwner ?????? AMI
  let systemType = 'Unknown'
  if (!ami) {
    const {imageName, imageOwner, systemType: imageSystemType} = findSystemInfo(system);
    const imageFilter = {
      Filters: [
        {
          Name: 'name',
          Values: [
            imageName
          ]
        },
        {
          Name: 'architecture',
          Values: [
            'x86_64'
          ]
        }
      ],
      Owners: [
        imageOwner
      ]
    }
    ami = await ec2.describeImages(imageFilter).promise().then(data => data.Images[0].ImageId)
    systemType = imageSystemType
  }

  // ?????? keyName = ????????????
  // ?????????????????????????????????????????????
  const keyName = String(Date.now())

  // ??????????????????????????????????????????????????????
  const keyMaterial = await ec2.createKeyPair({
    KeyName: keyName
  }).promise().then(data => data.KeyMaterial)

  // ???????????????
  const groupId = await ec2.createSecurityGroup({
    Description: keyName,
    GroupName: keyName
  }).promise().then(data => data.GroupId)

  // ?????????????????????
  await ec2.authorizeSecurityGroupIngress({
    GroupId: groupId,
    IpPermissions: allowAllIngressRule
  }).promise()

  // ???????????? userData ?????????????????? userData
  if (userData) {}

  // ???????????? userData????????????????????????????????????????????? userData
  else if (!userData && password && systemType === 'Linux') {
    userData = "#!/bin/bash\necho root:" + password + "|sudo chpasswd root\nsudo rm -rf /etc/ssh/sshd_config\nsudo tee /etc/ssh/sshd_config <<EOF\nClientAliveInterval 120\nSubsystem       sftp    /usr/lib/openssh/sftp-server\nX11Forwarding yes\nPrintMotd no\nChallengeResponseAuthentication no\nPasswordAuthentication yes\nPermitRootLogin yes\nUsePAM yes\nAcceptEnv LANG LC_*\nEOF\nsudo systemctl restart sshd\n"
  }

  userData = userData ? btoa(userData) : ''

  // ????????????
  const instanceId = await ec2.runInstances({
    BlockDeviceMappings: [
      {
        DeviceName: "/dev/xvda",
        Ebs: {
          VolumeSize: VolumeSize
        }
      }
    ],
    ImageId: ami,
    InstanceType: InstanceType,
    KeyName: keyName,
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: [
      groupId
    ],
    UserData: userData
  }).promise().then(data => data.Instances[0].InstanceId)

  return {
    instanceId: instanceId,
    KeyMaterial: keyMaterial,
    systemType: systemType
  };
}