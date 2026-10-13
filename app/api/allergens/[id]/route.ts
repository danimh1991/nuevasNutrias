import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { customAllergens, foodExposures, hiddenAllergens } from "../../../../db/schema";
import { errorResponse, ownerId } from "../../helpers";
import { pinGuard } from "../../../pin-auth";

const defaultIds=new Set(["milk","egg","peanut","tree-nuts","fish","shellfish","wheat","soy","sesame","molluscs","celery","mustard","lupin","sulphites"]);

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
  const denied=await pinGuard(request);if(denied)return denied;
  try{
    const{id}=await params,owner=ownerId(request),db=getDb();
    if(id.startsWith("custom-")){
      const removed=await db.delete(customAllergens).where(and(eq(customAllergens.id,id),eq(customAllergens.ownerId,owner))).returning({id:customAllergens.id});
      if(!removed[0])return Response.json({error:"Alimento no encontrado."},{status:404});
    }else{
      if(!defaultIds.has(id))return Response.json({error:"Alimento no encontrado."},{status:404});
      await db.insert(hiddenAllergens).values({id:crypto.randomUUID(),ownerId:owner,allergenId:id,createdAt:new Date().toISOString()}).onConflictDoNothing();
    }
    await db.delete(foodExposures).where(and(eq(foodExposures.ownerId,owner),eq(foodExposures.allergenId,id)));
    return Response.json({ok:true});
  }catch(error){return errorResponse(error)}
}
