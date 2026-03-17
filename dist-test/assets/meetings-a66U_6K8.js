import{v as s}from"./index-gbvMouBi.js";const n=async e=>(await s.get(`/api/meetings/${e}`)).data,o=async e=>(await s.post("/api/meetings/match",{meeting_request_id:e})).data;export{n as g,o as p};
