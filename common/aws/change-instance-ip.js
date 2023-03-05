import AWS from 'aws-sdk';

/**
 * Change the IP address of an instance
 * @param awsConfig {AWS.Config}
 * @param instanceId {string}
 * @return {Promise<{}>}
 */
export default async function changeInstanceIp(awsConfig, {instanceId}) {
  AWS.config = awsConfig;
  const ec2 = new AWS.EC2();

  // allocate a new IP address
  const allocationId = await ec2.allocateAddress({
    Domain: 'vpc'
  }).promise().then(data => data.AllocationId);

  // associate the new IP address to the instance
  const associationId = await ec2.associateAddress({
    AllocationId: allocationId,
    InstanceId: instanceId
  }).promise().then(data => data.AssociationId);

  // disassociate the IP address
  await ec2.disassociateAddress({
    AssociationId: associationId
  }).promise();

  // release the IP address
  await ec2.releaseAddress({
    AllocationId: allocationId
  }).promise();

  return {};
}