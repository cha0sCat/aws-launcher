import AWS from 'aws-sdk';
import proxyAgent from 'proxy-agent';
import launchInstance from '../common/aws/launch-instance.js';

export default async function handler(req, res) {
    const awsConfig = new AWS.Config({
        accessKeyId: req.body.aki,
        secretAccessKey: req.body.saki,
        region: req.body.region,
    });

    if (req.body.useProxy) {
        awsConfig.update({
            httpOptions: { agent: proxyAgent(req.body.proxy) }
        })
    }

    const instanceConfig = {
        system: req.body.system,
        ami: req.body.ami,
        password: req.body.password,
        userData: req.body.userData,
        InstanceType: req.body.InstanceType,
        VolumeSize: req.body.VolumeSize,
    }
    try {
        const data = await launchInstance(awsConfig, instanceConfig)
        res.status(200).send(data);
    } catch (err) {
        console.log(err)
        res.status(500).send({
            error: err
        });
    }
}