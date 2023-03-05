import AWS from 'aws-sdk';
import proxyAgent from 'proxy-agent';
import changeInstanceIP from '../../common/aws/change-instance-ip';

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

    try {
        const data = await changeInstanceIP(awsConfig, {instanceId: req.body.instanceId})
        res.status(200).send(data);
    } catch (err) {
        console.log(err)
        res.status(500).send({
            error: err
        });
    }
}