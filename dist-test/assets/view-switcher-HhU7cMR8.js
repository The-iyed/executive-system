import{r as g,j as e}from"./index-gbvMouBi.js";const o="data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M17.5%2017.5L14.5834%2014.5833M16.6667%209.58333C16.6667%2013.4954%2013.4954%2016.6667%209.58333%2016.6667C5.67132%2016.6667%202.5%2013.4954%202.5%209.58333C2.5%205.67132%205.67132%202.5%209.58333%202.5C13.4954%202.5%2016.6667%205.67132%2016.6667%209.58333Z'%20stroke='white'%20stroke-width='1.66667'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e",b=({className:t="",placeholder:r="بحث",value:a,onChange:s,variant:x="header"})=>{const[p,d]=g.useState(""),n=a!==void 0?a:p,i=c=>{const l=c.target.value;a===void 0&&d(l),s==null||s(l)};return x==="header"?e.jsxs("div",{className:`
          relative
          flex flex-row justify-end items-center
          h-[42px]
          pt-[10px] pr-[16px] pb-[10px] pl-[16px]
          gap-[10px]
          rounded-[73px]
          bg-[rgba(255,255,255,0.08)]
          ${t}
        `,style:{width:t.includes("w-")?void 0:"191px"},children:[e.jsx("div",{className:"absolute inset-0 rounded-[73px] pointer-events-none",style:{border:"1px solid rgba(255, 255, 255, 0.3)",borderBottom:"none",clipPath:"polygon(0 0, 131px 0, 31px 100%, 0 100%, 0 0, 190px 0, 241px 0, 321px 100%, -170px 100%, 196px 0)",boxShadow:"0 -1px 2px rgba(255, 255, 255, 0.15)"}}),e.jsx("img",{src:o,alt:"Search",className:"w-5 h-5"}),e.jsx("input",{type:"text",placeholder:r,value:n,onChange:i,className:"w-full h-6 text-base font-normal bg-transparent border-none outline-none text-white placeholder:text-white",style:{fontFamily:"'Almarai', sans-serif"}})]}):e.jsxs("div",{dir:"rtl",className:`
        relative flex flex-row items-center
        h-10 pl-4 pr-4 gap-3
        rounded-full
        bg-white
        border-none
        shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]
        ${t}
      `,children:[e.jsx("img",{src:o,alt:"",className:"w-5 h-5 flex-shrink-0 opacity-80",style:{filter:"brightness(0) saturate(100%)"},"aria-hidden":!0}),e.jsx("input",{type:"text",placeholder:r,value:n,onChange:i,className:"w-full min-w-0 h-[30px] text-[15px] font-normal bg-transparent border-none outline-none text-right placeholder:text-[#5E6977] text-gray-800",style:{fontFamily:"'Almarai', 'Almarai', sans-serif"}})]})},h="data:image/svg+xml,%3csvg%20width='18'%20height='18'%20viewBox='0%200%2018%2018'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M2.25%209H15.75M2.25%204.5H15.75M2.25%2013.5H15.75'%20stroke='%236F6F6F'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e",w="data:image/svg+xml,%3csvg%20width='17'%20height='12'%20viewBox='0%200%2017%2012'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M15.75%204.5H0.750001M0.750001%203.15L0.750001%208.85C0.750001%209.69008%200.750001%2010.1101%200.913491%2010.431C1.0573%2010.7132%201.28677%2010.9427%201.56902%2011.0865C1.88988%2011.25%202.30992%2011.25%203.15%2011.25L13.35%2011.25C14.1901%2011.25%2014.6101%2011.25%2014.931%2011.0865C15.2132%2010.9427%2015.4427%2010.7132%2015.5865%2010.431C15.75%2010.1101%2015.75%209.69008%2015.75%208.85V3.15C15.75%202.30992%2015.75%201.88988%2015.5865%201.56902C15.4427%201.28677%2015.2132%201.0573%2014.931%200.913491C14.6101%200.750001%2014.1901%200.750001%2013.35%200.750001L3.15%200.75C2.30992%200.75%201.88988%200.75%201.56902%200.91349C1.28677%201.0573%201.0573%201.28677%200.913491%201.56901C0.750001%201.88988%200.750001%202.30992%200.750001%203.15Z'%20stroke='black'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e",f=({view:t,onViewChange:r,className:a=""})=>e.jsxs("div",{className:`
        flex flex-col justify-center items-center
        p-1 gap-2
        w-[44px] h-[88px]
        bg-white
        rounded-full
        shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]
        border border-gray-200/80
        ${a}
      `,style:{transform:"rotate(90deg)"},children:[e.jsx("button",{onClick:()=>r("table"),className:`
          flex flex-row justify-center items-center
          p-2 gap-1.5
          w-[36px] h-[36px]
          rounded-full
          transition-all
          ${t==="table"?"bg-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]":"bg-transparent hover:bg-gray-50"}
        `,style:{transform:"rotate(-90deg)"},"aria-label":"Table view",children:e.jsx("img",{src:h,alt:"",className:"w-4 h-4","aria-hidden":!0})}),e.jsx("button",{onClick:()=>r("cards"),className:`
          flex flex-row justify-center items-center
          p-2 gap-1.5
          w-[36px] h-[36px]
          rounded-full
          transition-all
          ${t==="cards"?"bg-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]":"bg-transparent hover:bg-gray-50"}
        `,style:{transform:"rotate(90deg)"},"aria-label":"Cards view",children:e.jsx("img",{src:w,alt:"",className:"w-4 h-4","aria-hidden":!0})})]});export{b as S,f as V};
