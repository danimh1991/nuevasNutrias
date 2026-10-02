import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { children, measurements } from "../../../db/schema";
import { errorResponse, ownerId, validDate } from "../helpers";
import { pinGuard } from "../../pin-auth";
export async function GET(request: Request) { const denied=await pinGuard(request);if(denied)return denied;try { const owner=ownerId(request), db=getDb(); const kids=await db.select().from(children).where(eq(children.ownerId,owner)).orderBy(asc(children.createdAt)); const records=await db.select().from(measurements).where(eq(measurements.ownerId,owner)).orderBy(asc(measurements.measuredAt)); return Response.json({children:kids,measurements:records}); } catch(error){ return errorResponse(error); } }
export async function POST(request: Request) { const denied=await pinGuard(request);if(denied)return denied;try { const body=await request.json() as {name?:string;birthDate?:string;sex?:string}; const name=body.name?.trim(); if(!name||!validDate(body.birthDate)||!["male","female"].includes(body.sex??"")) return Response.json({error:"Revisa los datos del niño."},{status:400}); const child={id:crypto.randomUUID(),ownerId:ownerId(request),name,birthDate:body.birthDate,sex:body.sex as "male"|"female"}; await getDb().insert(children).values(child); return Response.json({child},{status:201}); } catch(error){ return errorResponse(error); } }
