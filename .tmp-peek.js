const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const rows=await p.work.findMany({select:{id:true,title:true,slug:true,imageUrl:true,mockupUrl:true},orderBy:{updatedAt:'desc'},take:10});
  console.log(rows);
  await p.$disconnect();
})();
