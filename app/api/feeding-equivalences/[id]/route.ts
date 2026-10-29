import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { feedingEquivalences } from "../../../../db/schema";
import { errorResponse, ownerId } from "../../helpers";
import { pinGuard } from "../../../pin-auth";

type AdditionalColumn={name:string;amount:number;unit:string};
type EquivalenceInput={title?:unknown;milkMl?:unknown;productAmount?:unknown;productUnit?:unknown;additionalColumns?:unknown};

function parseAdditionalColumns(value:unknown):AdditionalColumn[]|null{
  if(!Array.isArray(value)||value.length>8)return null;
  const columns:AdditionalColumn[]=[];
  for(const item of value){
    if(!item||typeof item!=="object")return null;
    const input=item as Record<string,unknown>,name=typeof input.name==="string"?input.name.trim():"",amount=Number(input.amount),unit=typeof input.unit==="string"?input.unit.trim():"";
    if(!name||name.length>50||!Number.isFinite(amount)||amount<=0||amount>10000||!unit||unit.length>30)return null;
    columns.push({name,amount,unit});
  }
  return columns;
}

function toResponse(equivalence:typeof feedingEquivalences.$inferSelect){
  const{additionalColumnsJson,...rest}=equivalence;
  let additionalColumns:AdditionalColumn[]=[];
  try{additionalColumns=JSON.parse(additionalColumnsJson) as AdditionalColumn[]}catch{}
  return{...rest,additionalColumns};
}

function parseEquivalence(body:EquivalenceInput){
  const title=typeof body.title==="string"?body.title.trim():"",milkMl=Number(body.milkMl),productAmount=Number(body.productAmount),productUnit=typeof body.productUnit==="string"?body.productUnit.trim():"",additionalColumns=parseAdditionalColumns(body.additionalColumns??[]);
  if(!title||title.length>100||!Number.isFinite(milkMl)||milkMl<=0||milkMl>10000||!Number.isFinite(productAmount)||productAmount<=0||productAmount>10000||!productUnit||productUnit.length>30||additionalColumns===null)return null;
  return{title,milkMl,productAmount,productUnit,additionalColumnsJson:JSON.stringify(additionalColumns)};
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const denied=await pinGuard(request);if(denied)return denied;
  try{const parsed=parseEquivalence(await request.json() as EquivalenceInput);if(!parsed)return Response.json({error:"Revisa el título, las columnas y sus cantidades. Deben ser números mayores que cero y las unidades son obligatorias."},{status:400});const{id}=await params;const[updated]=await getDb().update(feedingEquivalences).set(parsed).where(and(eq(feedingEquivalences.id,id),eq(feedingEquivalences.ownerId,ownerId(request)))).returning();if(!updated)return Response.json({error:"Equivalencia no encontrada."},{status:404});return Response.json({equivalence:toResponse(updated)})}catch(error){return errorResponse(error)}
}

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
  const denied=await pinGuard(request);if(denied)return denied;
  try{const{id}=await params;const removed=await getDb().delete(feedingEquivalences).where(and(eq(feedingEquivalences.id,id),eq(feedingEquivalences.ownerId,ownerId(request)))).returning({id:feedingEquivalences.id});if(!removed[0])return Response.json({error:"Equivalencia no encontrada."},{status:404});return Response.json({ok:true})}catch(error){return errorResponse(error)}
}
