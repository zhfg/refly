import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { DataType } from '@zilliz/milvus2-sdk-node';

const address = 'localhost:19530';
const token = 'root:Milvus';
const ssl = false;
const milvusClient = new MilvusClient({ address, ssl, token });

const params = {
  collection_name: 'refly',
  description: 'Refly Content Search',
  fields: [
    {
      name: 'url',
      description: 'weblink url',
      data_type: DataType.VarChar,
    },
    {
      name: 'title',
      description: 'weblink title',
      data_type: DataType.VarChar,
      max_length: 500,
    },
    {
      name: 'type',
      description: 'content type',
      data_type: DataType.VarChar,
      max_length: 100,
    },
    {
      name: 'chunk_id',
      description: 'chunk id',
      data_type: DataType.VarChar,
      max_length: 100,
    },
    {
      name: 'content',
      description: 'chunked content',
      data_type: DataType.VarChar,
      max_length: 10000,
    },
    {
      name: 'vector',
      description: 'vector of chunked content',
      data_type: DataType.FloatVector,
      dim: 256,
    },
  ],
  enableDynamicField: true,
};

async function main() {
  const res = await milvusClient.createCollection(params);
  console.log('create collections status:', res);

  const loadRes = await milvusClient.loadCollection({
    collection_name: params.collection_name,
  });
  console.log('load collections status:', loadRes);

  await milvusClient.hybridSearch({
    collection_name: 'refly',
    anns_field: 'vector',
    data: {},
  });
}

main();
