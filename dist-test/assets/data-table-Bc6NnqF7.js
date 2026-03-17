import{j as r}from"./index-gbvMouBi.js";const b=({columns:n,data:i,onRowClick:d,className:f="",rowPadding:c="py-4",variant:p="cards"})=>{const o=e=>e==="center"?"justify-center":e==="start"?"justify-start":"justify-end",a=e=>e==="center"?"text-center":e==="start"?"text-left":"text-right",l=p==="cards";return r.jsxs("div",{className:`
        box-border flex flex-col w-full overflow-hidden
        ${l?" rounded-xl p-4":" border border-gray-200 rounded-xl shadow-[0px_1px_3px_rgba(16,24,40,0.1),0px_1px_2px_rgba(16,24,40,0.06)]"}
        ${f}
      `,dir:"rtl",children:[r.jsx("div",{className:`
          flex flex-row w-full rounded-lg
          bg-[#F9FAFB] border-b border-gray-200
        `,children:n.map(e=>{const s=e.align??"end";return r.jsx("div",{className:`
                box-border flex flex-row items-center ${o(s)}
                px-5 py-3.5 gap-3 min-w-0
                ${e.width||"flex-1"}
              `,children:r.jsx("span",{className:`
                  text-sm font-bold text-gray-700 leading-[18px]
                  ${a(s)}
                  block truncate w-full
                `,children:e.header})},e.id)})}),r.jsx("div",{className:l?"flex flex-col gap-3 mt-0 pt-3":"flex flex-col w-full",children:i.length===0?r.jsx("div",{className:"flex flex-row w-full",children:r.jsx("div",{className:"box-border flex flex-row items-center justify-center px-6 py-2 w-full rounded-lg bg-white/80",children:r.jsx("span",{className:"text-sm font-normal text-gray-500 leading-5",children:"لا توجد بيانات لعرضها"})})}):i.map((e,s)=>r.jsx("div",{onClick:()=>d==null?void 0:d(e,s),className:`
                flex flex-row w-full transition-colors
                ${l?"bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)] cursor-pointer h-[50px]":"cursor-pointer h-[50px] hover:bg-gray-50 border-b border-gray-200"}
              `,children:n.map(t=>{const x=t.align??"end";return r.jsx("div",{className:`
                      box-border flex flex-row items-center ${o(x)}
                      px-5 ${c} gap-4 min-w-0 max-h-[50px]!
                      ${t.width||"flex-1"}
                      ${l?"first:rounded-r-2xl last:rounded-l-2xl":""}
                    `,children:t.render?r.jsx("div",{className:"w-full min-w-0 overflow-hidden",children:t.render(e,s)}):r.jsx("div",{className:`w-full min-w-0 overflow-hidden ${a(x)}`,children:t.accessor?r.jsx("span",{className:`text-[15px] font-normal text-gray-700 leading-5 ${a(x)} block truncate`,children:t.accessor(e)}):r.jsx("span",{className:`text-[15px] font-normal text-gray-700 leading-5 ${a(x)} block truncate`,children:e[t.id]})})},t.id)})},s))})]})};export{b as D};
