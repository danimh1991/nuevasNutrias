import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { feedingEquivalences } from "../../../db/schema";
import { errorResponse, ownerId } from "../helpers";
import { pinGuard } from "../../pin-auth";

type EquivalenceInput={title?:unknown;milkMl?:unknown;productAmount?:unknown;productUnit?:unknown};

function parseEquivalence(body:EquivalenceInput){
  const title=typeof body.title==="string"?body.title.trim():"",milkMl=Number(body.milkMl),productAmount=Number(body.productAmount),productUnit=typeof body.productUnit==="string"?body.productUnit.trim():"";
  if(!title||title.length>100||!Number.isFinite(milkMl)||milkMl<=0||milkMl>10000||!Number.isFinite(productAmount)||productAmount<=0||productAmount>10000||!productUnit||productUnit.length>30)return null;
  return{title,milkMl,productAmount,productUnit};
}

export async function GET(request:Request){
  const denied=await pinGuard(request);if(denied)return denied;
  try{const equivalences=await getDb().select().from(feedingEquivalences).where(eq(feedingEquivalences.ownerId,ownerId(request))).orderBy(desc(feedingEquivalences.createdAt));return Response.json({equivalences})}catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
  const denied=await pinGuard(request);if(denied)return denied;
  try{const parsed=parseEquivalence(await request.json() as EquivalenceInput);if(!parsed)return Response.json({error:"Revisa el título y las cantidades. Deben ser números mayores que cero y la unidad es obligatoria."},{status:400});const equivalence={id:crypto.randomUUID(),ownerId:ownerId(request),...parsed,createdAt:new Date().toISOString()};await getDb().insert(feedingEquivalences).values(equivalence);return Response.json({equivalence},{status:201})}catch(error){return errorResponse(error)}
}
