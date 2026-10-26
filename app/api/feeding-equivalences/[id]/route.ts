import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { feedingEquivalences } from "../../../../db/schema";
import { errorResponse, ownerId } from "../../helpers";
import { pinGuard } from "../../../pin-auth";

type EquivalenceInput={title?:unknown;milkMl?:unknown;productAmount?:unknown;productUnit?:unknown};

function parseEquivalence(body:EquivalenceInput){
  const title=typeof body.title==="string"?body.title.trim():"",milkMl=Number(body.milkMl),productAmount=Number(body.productAmount),productUnit=typeof body.productUnit==="string"?body.productUnit.trim():"";
  if(!title||title.length>100||!Number.isFinite(milkMl)||milkMl<=0||milkMl>10000||!Number.isFinite(productAmount)||productAmount<=0||productAmount>10000||!productUnit||productUnit.length>30)return null;
  return{title,milkMl,productAmount,productUnit};
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const denied=await pinGuard(request);if(denied)return denied;
  try{const parsed=parseEquivalence(await request.json() as EquivalenceInput);if(!parsed)return Response.json({error:"Revisa el título y las cantidades. Deben ser números mayores que cero y la unidad es obligatoria."},{status:400});const{id}=await params;const[updated]=await getDb().update(feedingEquivalences).set(parsed).where(and(eq(feedingEquivalences.id,id),eq(feedingEquivalences.ownerId,ownerId(request)))).returning();if(!updated)return Response.json({error:"Equivalencia no encontrada."},{status:404});return Response.json({equivalence:updated})}catch(error){return errorResponse(error)}
}

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
  const denied=await pinGuard(request);if(denied)return denied;
  try{const{id}=await params;const removed=await getDb().delete(feedingEquivalences).where(and(eq(feedingEquivalences.id,id),eq(feedingEquivalences.ownerId,ownerId(request)))).returning({id:feedingEquivalences.id});if(!removed[0])return Response.json({error:"Equivalencia no encontrada."},{status:404});return Response.json({ok:true})}catch(error){return errorResponse(error)}
}
