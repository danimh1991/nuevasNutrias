import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { feedingEquivalences } from "../../../../db/schema";
import { errorResponse, ownerId } from "../../helpers";
import { pinGuard } from "../../../pin-auth";

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
  const denied=await pinGuard(request);if(denied)return denied;
  try{const{id}=await params;const removed=await getDb().delete(feedingEquivalences).where(and(eq(feedingEquivalences.id,id),eq(feedingEquivalences.ownerId,ownerId(request)))).returning({id:feedingEquivalences.id});if(!removed[0])return Response.json({error:"Equivalencia no encontrada."},{status:404});return Response.json({ok:true})}catch(error){return errorResponse(error)}
}
