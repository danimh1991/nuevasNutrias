"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, ChefHat, CircleAlert, ExternalLink, Info, ShieldAlert, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export type FoodExposure={childId:string;allergenId:string;dayIndex:number;exposedAt:string};
type FoodChild={id:string;name:string;birthDate:string};

const API_BASE=process.env.NEXT_PUBLIC_BASE_PATH??"";
const api=(path:string)=>`${API_BASE}${path}`;
const today=()=>new Date().toISOString().slice(0,10);
const dateText=(date:string)=>new Intl.DateTimeFormat("es-ES",{day:"numeric",month:"short"}).format(new Date(`${date}T12:00:00`));

const allergens=[
  {id:"milk",name:"Leche de vaca",hint:"Yogur natural, queso pasteurizado o leche en una receta",emoji:"🥛",common:true},
  {id:"egg",name:"Huevo",hint:"Siempre bien cocinado",emoji:"🥚",common:true},
  {id:"peanut",name:"Cacahuete",hint:"Crema 100% diluida o polvo; nunca entero",emoji:"🥜",common:true},
  {id:"tree-nuts",name:"Frutos de cáscara",hint:"Molidos o en crema fina; prueba uno cada vez",emoji:"🌰",common:true},
  {id:"fish",name:"Pescado",hint:"Bien cocinado, sin espinas y bajo en mercurio",emoji:"🐟",common:true},
  {id:"shellfish",name:"Crustáceos",hint:"Gamba, langostino o cangrejo bien cocinados",emoji:"🦐",common:true},
  {id:"wheat",name:"Trigo / gluten",hint:"Pan blando, pasta o cereal adaptado",emoji:"🌾",common:true},
  {id:"soy",name:"Soja",hint:"Tofu cocinado o yogur de soja sin azúcar",emoji:"🫘",common:true},
  {id:"sesame",name:"Sésamo",hint:"Tahini bien diluido",emoji:"⚪",common:true},
  {id:"molluscs",name:"Moluscos",hint:"Mejillón, almeja o calamar bien cocinados",emoji:"🐚",common:false},
  {id:"celery",name:"Apio",hint:"Cocinado y con textura segura",emoji:"🌿",common:false},
  {id:"mustard",name:"Mostaza",hint:"Cantidad mínima dentro de una preparación",emoji:"🟡",common:false},
  {id:"lupin",name:"Altramuz",hint:"Harina de altramuz en alimento adaptado",emoji:"🌱",common:false},
  {id:"sulphites",name:"Sulfitos",hint:"Presentes en algunos procesados y frutas secas",emoji:"🍇",common:false},
];

const guide=[
  {until:"≈ 6 meses",title:"Alimentación complementaria",text:"La OMS recomienda iniciarla alrededor de los 6 meses, cuando el bebé muestra señales de preparación; antes, leche materna o fórmula.",tone:"teal",source:"OMS",url:"https://www.who.int/health-topics/complementary-feeding"},
  {until:"12 meses",title:"Miel",text:"No ofrecer, ni siquiera cocinada, por riesgo de botulismo infantil. La recomendación oficial es hasta cumplir 1 año, no 24 meses.",tone:"amber",source:"NHS",url:"https://www.nhs.uk/baby/weaning-and-feeding/foods-to-avoid-giving-babies-and-young-children/"},
  {until:"12 meses",title:"Leche animal como bebida principal",text:"No sustituir leche materna o fórmula por leche de vaca, cabra u oveja. Sí pueden usarse lácteos pasteurizados o pequeñas cantidades en recetas desde los 6 meses.",tone:"amber",source:"NHS",url:"https://www.nhs.uk/baby/weaning-and-feeding/drinks-and-cups-for-babies-and-young-children/"},
  {until:"12 meses",title:"Espinacas y acelgas",text:"AESAN recomienda evitarlas. Si pediatría indica usarlas entre 6 y 12 meses, no superar 35 g/día. Entre 1 y 3 años, máximo 45 g/día.",tone:"amber",source:"AESAN",url:"https://aesan.gob.es/dam/jcr:05045da1-f03a-4a47-906b-7bb2f9c99c40/TRIPTICO_AESAN_RECOMENDACION_CONSUMO_HORTALIZAS_NITRATOS_.pdf"},
  {until:"3 años",title:"Borraja",text:"AESAN recomienda no incluirla antes de los 3 años por su contenido en nitratos.",tone:"coral",source:"AESAN",url:"https://aesan.gob.es/seguridad-alimentaria/contaminantes-quimicos/nitratos"},
  {until:"5 años",title:"Bebidas de arroz",text:"No usarlas como sustituto de la leche materna, fórmula o leche de vaca por su posible contenido en arsénico. El arroz como alimento sí puede formar parte de una dieta variada.",tone:"coral",source:"NHS",url:"https://www.nhs.uk/baby/weaning-and-feeding/foods-to-avoid-giving-babies-and-young-children/"},
  {until:"5 años",title:"Frutos secos enteros y alimentos duros",text:"Evitar frutos secos enteros por atragantamiento. Ofrecerlos molidos o en crema fina. Uvas y tomates, en cuartos; zanahoria y manzana, cocinadas o ralladas.",tone:"coral",source:"NHS",url:"https://www.nhs.uk/baby/weaning-and-feeding/foods-to-avoid-giving-babies-and-young-children/"},
  {until:"10 años",title:"Pescados con alto mercurio",text:"Evitar pez espada/emperador, atún rojo, tiburón (cazón, marrajo, tintorera…) y lucio. Elegir merluza, salmón, sardina, bacalao o lenguado, siempre sin espinas.",tone:"navy",source:"AESAN",url:"https://www.aesan.gob.es/actualidad/publicaciones-seguridad-alimentaria/recomendaciones-de-consumo-de-pescado-por-presencia-de-mercurio"},
  {until:"Siempre",title:"Crudos, poco hechos y no pasteurizados",text:"Evitar carne, pescado, marisco y huevo crudos o poco hechos, además de leche y quesos no pasteurizados, por riesgo de infección alimentaria.",tone:"navy",source:"NHS",url:"https://www.nhs.uk/baby/weaning-and-feeding/foods-to-avoid-giving-babies-and-young-children/"},
  {until:"0–23 meses",title:"Sal, azúcar, zumos y ultraprocesados",text:"No añadir sal ni azúcar. Evitar bebidas azucaradas, zumos, bollería, embutidos, snacks y alimentos altos en sal, azúcar o grasas trans.",tone:"navy",source:"OMS",url:"https://www.who.int/news-room/fact-sheets/detail/healthy-diet"},
  {until:"Siempre",title:"Riesgos de atragantamiento",text:"Evitar palomitas, salchichas en rodajas, caramelos, cucharadas de crema de frutos secos y trozos duros o redondos. Comer sentado y con supervisión constante.",tone:"navy",source:"OMS",url:"https://www.who.int/health-topics/complementary-feeding"},
];

const recipes=[
  {min:6,title:"Tortita de plátano y avena",time:"12 min",ingredients:"Plátano, huevo y avena molida",allergens:["Huevo","Gluten"],text:"Tiras blandas del tamaño de dos dedos; huevo totalmente cuajado."},
  {min:6,title:"Brócoli con crema de alubias",time:"15 min",ingredients:"Brócoli, alubias blancas y AOVE",allergens:[],text:"Ramilletes con tallo largo, muy tiernos, con crema espesa para untar."},
  {min:6,title:"Boniato con yogur",time:"25 min",ingredients:"Boniato, yogur natural entero y canela",allergens:["Leche"],text:"Gajos asados muy blandos; yogur sin azúcar como acompañamiento."},
  {min:6,title:"Aguacate con sésamo",time:"5 min",ingredients:"Aguacate y tahini diluido",allergens:["Sésamo"],text:"Gajos maduros rebozados con una capa muy fina de tahini diluido."},
  {min:7,title:"Hamburguesitas de merluza",time:"20 min",ingredients:"Merluza, patata y perejil",allergens:["Pescado"],text:"Sin espinas, bien cocinadas y fáciles de aplastar entre los dedos."},
  {min:7,title:"Hummus suave con calabacín",time:"15 min",ingredients:"Garbanzo, tahini, calabacín y limón",allergens:["Sésamo"],text:"Sin sal; servir espeso sobre bastones de calabacín muy tiernos."},
  {min:8,title:"Albóndigas de pavo y pera",time:"25 min",ingredients:"Pavo, pera rallada y avena",allergens:["Gluten"],text:"Forma alargada, jugosa, completamente cocinada y sin sal añadida."},
  {min:8,title:"Pasta con pesto de guisantes",time:"18 min",ingredients:"Pasta, guisantes, albahaca y AOVE",allergens:["Gluten"],text:"Pasta grande y muy cocida; salsa sin sal ni frutos secos enteros."},
  {min:9,title:"Croquetas de lenteja y zanahoria",time:"30 min",ingredients:"Lenteja, zanahoria, huevo y pan rallado",allergens:["Huevo","Gluten"],text:"Horneadas, formato alargado y textura húmeda que se deshaga."},
  {min:9,title:"Arroz meloso con salmón",time:"25 min",ingredients:"Arroz, salmón, calabaza y puerro",allergens:["Pescado"],text:"Meloso, sin sal y con el pescado totalmente cocinado y revisado."},
  {min:12,title:"Mini tortilla de verduras",time:"20 min",ingredients:"Huevo, patata, calabacín y cebolla",allergens:["Huevo"],text:"Cuajada por completo; cortar en tiras o bocados según destreza."},
  {min:12,title:"Cuscús con pollo y verduras",time:"22 min",ingredients:"Cuscús, pollo, calabacín y zanahoria",allergens:["Gluten"],text:"Pollo tierno deshilachado; humedecer bien el cuscús para manejarlo."},
];

function monthsOld(birthDate:string){return Math.max(0,Math.floor((Date.now()-new Date(`${birthDate}T12:00:00`).getTime())/(1000*60*60*24*30.4375)))}

export default function FoodTracker({child,exposures,onChange}:{child:FoodChild;exposures:FoodExposure[];onChange:(next:FoodExposure[])=>void}){
  const[section,setSection]=useState<"allergens"|"guide"|"recipes">("allergens"),[showAll,setShowAll]=useState(false),[saving,setSaving]=useState("");
  const childExposures=useMemo(()=>exposures.filter(item=>item.childId===child.id),[exposures,child.id]);
  const age=monthsOld(child.birthDate),availableRecipes=recipes.filter(recipe=>age>=recipe.min);
  async function toggle(allergenId:string,dayIndex:number,checked:boolean){
    const key=`${allergenId}-${dayIndex}`;
    if(checked){const previous=childExposures.find(item=>item.allergenId===allergenId&&item.dayIndex===dayIndex-1);if(dayIndex>1&&!previous)return;if(previous?.exposedAt===today()){toast.info("Marca una exposición por día para que el recuento represente días distintos.");return}}
    setSaving(key);
    const res=await fetch(api("/api/food-exposures"),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({childId:child.id,allergenId,dayIndex,checked,exposedAt:today()})});
    const out=await res.json() as {error?:string;exposure?:FoodExposure|null};setSaving("");
    if(!res.ok){toast.error(out.error??"No se ha podido guardar.");return}
    const without=exposures.filter(item=>!(item.childId===child.id&&item.allergenId===allergenId&&item.dayIndex===dayIndex));
    onChange(out.exposure?[...without,out.exposure]:without);toast.success(checked?`Día ${dayIndex} registrado`:"Check eliminado");
  }
  return <div className="mt-6">
    <div className="grid gap-3 sm:grid-cols-3">
      {([{id:"allergens",label:"Alérgenos",icon:ShieldAlert,sub:"Regla de 3 días"},{id:"guide",label:"Guía segura",icon:Info,sub:"OMS + AESAN"},{id:"recipes",label:"Recetas BLW",icon:ChefHat,sub:`Para ${age} meses`}] as const).map(item=><button key={item.id} onClick={()=>setSection(item.id)} className={`flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left transition ${section===item.id?"border-[#087f8c] bg-[#eaf7f6] shadow-sm":"border-[#dfe8ef] bg-white hover:border-[#9ec8d1]"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${section===item.id?"bg-[#087f8c] text-white":"bg-[#eef3f6] text-[#527186]"}`}><item.icon size={20}/></span><span><strong className="block">{item.label}</strong><small className="text-[#708496]">{item.sub}</small></span></button>)}
    </div>
    {section==="allergens"&&<section className="mt-5">
      <div className="rounded-3xl bg-[#103f5c] p-5 text-white sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-[#9ec8d1]">SEGUIMIENTO DE {child.name.toUpperCase()}</p><h2 className="font-display mt-1 text-2xl font-bold">Introducción de alérgenos</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#d3e5e9]">Introduce un alimento cada vez, en una forma segura y preferiblemente por la mañana. Marca un check por día y observa posibles reacciones.</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><strong className="font-display text-2xl">{allergens.filter(a=>childExposures.filter(e=>e.allergenId===a.id).length===3).length}/{allergens.length}</strong><span className="block text-xs text-[#cfe1e6]">completados</span></div></div></div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">{allergens.filter(a=>showAll||a.common).map(allergen=>{const done=childExposures.filter(item=>item.allergenId===allergen.id).sort((a,b)=>a.dayIndex-b.dayIndex);return <article key={allergen.id} className="rounded-3xl border border-[#dfe8ef] bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff5e6] text-xl">{allergen.emoji}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-bold">{allergen.name}</h3><Badge className={done.length===3?"bg-[#dff3e8] text-[#17643a]":"bg-[#eef3f6] text-[#587084]"}>{done.length}/3 días</Badge></div><p className="mt-0.5 text-xs text-[#708496]">{allergen.hint}</p></div></div><Progress className="mt-4 h-1.5" value={done.length/3*100}/><div className="mt-3 grid grid-cols-3 gap-2">{[1,2,3].map(day=>{const record=done.find(item=>item.dayIndex===day),canUse=!!record||day===done.length+1,isSaving=saving===`${allergen.id}-${day}`;return <button key={day} disabled={!canUse||!!saving} onClick={()=>void toggle(allergen.id,day,!record)} className={`min-h-12 rounded-xl border px-2 text-xs font-bold transition disabled:cursor-not-allowed ${record?"border-[#78c09b] bg-[#e6f6ed] text-[#17643a]":"border-[#dfe8ef] bg-[#f8fafb] text-[#6f8395] disabled:opacity-45"}`}>{record?<><Check className="mx-auto mb-0.5" size={15}/>{dateText(record.exposedAt)}</>:isSaving?"Guardando…":`Día ${day}`}</button>})}</div></article>})}</div>
      <button onClick={()=>setShowAll(value=>!value)} className="mt-4 w-full rounded-2xl border border-dashed border-[#a9becb] bg-white p-3 text-sm font-bold text-[#087f8c]">{showAll?"Ver solo los alérgenos más habituales":"Ver los 14 alérgenos de declaración obligatoria"}</button>
      <div className="mt-4 flex gap-3 rounded-2xl border border-[#f0d493] bg-[#fff9e9] p-4 text-sm leading-relaxed text-[#6d5520]"><CircleAlert className="mt-0.5 shrink-0" size={19}/><p><b>Seguridad:</b> si hay dificultad para respirar, hinchazón de lengua/labios, decaimiento intenso o síntomas generalizados, llama al 112. Con eczema grave, alergia conocida o reacción previa, consulta con pediatría/alergología antes de introducir nuevos alérgenos.</p></div>
    </section>}
    {section==="guide"&&<section className="mt-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-widest text-[#087f8c]">GUÍA GENERAL · NO CAMBIA ENTRE PERFILES</p><h2 className="font-display mt-1 text-2xl font-bold">Qué evitar y hasta cuándo</h2></div><Badge className="bg-[#eaf7f6] text-[#087f8c]">Revisada · oct 2026</Badge></div><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#63798b]">Resumen práctico basado en recomendaciones de OMS y organismos oficiales. Cada tarjeta enlaza directamente a su fuente; no sustituye las indicaciones de vuestro equipo pediátrico.</p><div className="mt-4 grid gap-3 lg:grid-cols-2">{guide.map(item=><article key={`${item.until}-${item.title}`} className="rounded-3xl border border-[#dfe8ef] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><Badge className="bg-[#fff0d5] text-[#7b5100]">{item.until==="Siempre"?"Evitar siempre":item.until==="0–23 meses"?"Durante 0–23 meses":`Hasta ${item.until}`}</Badge><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#087f8c] hover:underline">{item.source}<ExternalLink size={13}/></a></div><h3 className="mt-3 font-display text-lg font-bold">{item.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-[#64798a]">{item.text}</p></article>)}</div></section>}
    {section==="recipes"&&<section className="mt-5"><div className="rounded-3xl bg-gradient-to-br from-[#f06449] to-[#e08a55] p-5 text-white sm:p-6"><p className="text-xs font-bold tracking-widest text-white/75">RECETARIO DE {child.name.toUpperCase()}</p><h2 className="font-display mt-1 text-2xl font-bold">Ideas BLW para {age} meses</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">Solo se muestran recetas adecuadas a su franja de edad. Ajusta siempre la textura a sus habilidades y supervisa todas las comidas.</p></div>{age<6?<div className="mt-4 rounded-3xl border border-dashed border-[#bfd0db] bg-white p-8 text-center"><Utensils className="mx-auto text-[#87a4b5]"/><h3 className="font-display mt-3 text-xl font-bold">El recetario se abrirá alrededor de los 6 meses</h3><p className="mx-auto mt-2 max-w-lg text-sm text-[#708496]">Antes de empezar, confirma señales de preparación: se mantiene sentado con apoyo, controla la cabeza, coordina mano-boca y ha perdido el reflejo de extrusión.</p></div>:<><div className="mt-4 flex flex-wrap gap-2">{[6,7,8,9,12].map(month=><Badge key={month} className={age>=month?"bg-[#dff3e8] text-[#17643a]":"bg-[#eef3f6] text-[#81909c]"}>{age>=month?<CheckCircle2 size={13}/>:null} {month}+ meses</Badge>)}</div><div className="mt-4 grid gap-4 lg:grid-cols-2">{availableRecipes.map(recipe=><article key={recipe.title} className="rounded-3xl border border-[#dfe8ef] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#fff0e8] text-[#d9573f]"><ChefHat size={20}/></span><div className="flex gap-2"><Badge className="bg-[#eef7f7] text-[#087f8c]">{recipe.min}+ meses</Badge><Badge variant="outline">{recipe.time}</Badge></div></div><h3 className="font-display mt-4 text-xl font-bold">{recipe.title}</h3><p className="mt-1 text-sm font-semibold text-[#465f72]">{recipe.ingredients}</p><p className="mt-2 text-sm leading-relaxed text-[#708496]">{recipe.text}</p>{recipe.allergens.length>0&&<div className="mt-3 flex flex-wrap gap-1.5">{recipe.allergens.map(allergen=><Badge key={allergen} className="bg-[#fff5df] text-[#7b5708]">Contiene {allergen}</Badge>)}</div>}</article>)}</div></>}</section>}
  </div>
}
