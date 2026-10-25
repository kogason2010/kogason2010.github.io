/* instruments/nca-hplc-modules/model.js — The HPLC modules the assembly robots stack.
   They are the lab's Nexera, module by module: nexera-modules.js (in this folder) builds them, and this file sizes them
   for the line (makeModule, MOD_KINDS, STACK). js/chemistry/assembly.js puts them on the line.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     MOD, MOD_KINDS, STACK, makeModule, modTextures (js/chemistry/assembly.js) */
"use strict";

/* HPLC geometry shared with the NCA robot feeder. */
const MOD={body:0x24282c,panel:0x474d54,dark:0x171e21,edge:0x101518,
  led:0x2d9865,steel:0xb9c0c4,W:0.42,D:NexeraModules.depth*0.42/NexeraModules.width};
const MOD_KINDS=Object.fromEntries(Object.entries(NexeraModules.kinds).map(([kind,k])=>[
  kind,{...k,h:k.h*MOD.W/NexeraModules.width,...(k.w?{w:k.w*MOD.W/NexeraModules.width}:{})}
]));
const STACK=[...NexeraModules.stack];
// Vertex-color meshes still build the pallet and robot, independently of module materials.
const modMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5,metalness:0.15});
let modScreenTex=null,ovenScreenTex=null;
function makeModule(kind){return NexeraModules.make(kind,MOD.W);}
function modTextures(){
  const textures=NexeraModules.textures();modScreenTex=textures.controller;ovenScreenTex=textures.oven;
}
