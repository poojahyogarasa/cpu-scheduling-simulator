let processes=[];
let selectedIndex=null;

let wtChartInstance=null;
let tatChartInstance=null;
let rtChartInstance=null;

/* TABLE */

function renderTable(){

const tbody=document.getElementById("processBody");
tbody.innerHTML="";

const algo=document.getElementById("algorithm").value;
const showPriority=(algo==="PRIORITY");

document.getElementById("priorityHeader").style.display=
showPriority?"":"none";

processes.forEach((p,index)=>{

const row=document.createElement("tr");

row.innerHTML=`
<td>${p.pid}</td>
<td>${p.arrival}</td>
<td>${p.burst}</td>
${showPriority?`<td>${p.priority ?? "-"}</td>`:""}
`;

row.onclick=()=>selectProcess(index);

tbody.appendChild(row);

});

}

/* SELECT */

function selectProcess(index){

selectedIndex=index;

let p=processes[index];

arrival.value=p.arrival;
burst.value=p.burst;
priority.value=p.priority ?? "";

updateBtn.style.display="inline-block";
deleteBtn.style.display="inline-block";

}

/* ADD */

function addProcess(){

let arrivalVal=parseInt(arrival.value);
let burstVal=parseInt(burst.value);

let prVal=priority.value==""?null:parseInt(priority.value);

if(isNaN(arrivalVal)||isNaN(burstVal)){
alert("Enter Arrival and Burst Time");
return;
}

let pid="P"+(processes.length+1);

processes.push({pid,arrival:arrivalVal,burst:burstVal,priority:prVal});

clearForm();
renderTable();

}

/* UPDATE */

function updateProcess(){

let arrivalVal=parseInt(arrival.value);
let burstVal=parseInt(burst.value);
let prVal=priority.value==""?null:parseInt(priority.value);

processes[selectedIndex].arrival=arrivalVal;
processes[selectedIndex].burst=burstVal;
processes[selectedIndex].priority=prVal;

clearForm();
renderTable();

}

/* DELETE */

function deleteSelected(){

processes.splice(selectedIndex,1);

processes.forEach((p,i)=>p.pid="P"+(i+1));

clearForm();
renderTable();

}

/* CLEAR */

function clearForm(){

arrival.value="";
burst.value="";
priority.value="";

updateBtn.style.display="none";
deleteBtn.style.display="none";

selectedIndex=null;

}

/* TOGGLE */

function toggleFields(){

let algo=algorithm.value;

quantum.style.display=(algo==="RR")?"inline-block":"none";
priority.style.display=(algo==="PRIORITY")?"inline-block":"none";

renderTable();

}

/* FCFS */

function fcfs(data){

let time=0;
let schedule=[];

data.sort((a,b)=>a.arrival-b.arrival);

data.forEach(p=>{
if(time<p.arrival) time=p.arrival;
let start=time;
time+=p.burst;
schedule.push({pid:p.pid,start,end:time});
});

return schedule;

}

/* SJF */

function sjf(data){

let time=0;
let completed=0;
let schedule=[];
let visited=new Array(data.length).fill(false);

while(completed<data.length){

let idx=-1;
let min=Infinity;

data.forEach((p,i)=>{
if(p.arrival<=time && !visited[i] && p.burst<min){
min=p.burst;
idx=i;
}
});

if(idx!=-1){

let start=time;
time+=data[idx].burst;

schedule.push({pid:data[idx].pid,start,end:time});

visited[idx]=true;
completed++;

}
else time++;

}

return schedule;

}

/* SRTF */

function srtf(data){

let time=0;
let completed=0;

let remaining=data.map(p=>p.burst);

let schedule=[];
let lastPid=null;
let startTime=0;

while(completed<data.length){

let idx=-1;
let min=Infinity;

data.forEach((p,i)=>{
if(p.arrival<=time && remaining[i]>0 && remaining[i]<min){
min=remaining[i];
idx=i;
}
});

if(idx!=-1){

if(lastPid!==data[idx].pid){

if(lastPid) schedule.push({pid:lastPid,start:startTime,end:time});

startTime=time;
lastPid=data[idx].pid;

}

remaining[idx]--;
time++;

if(remaining[idx]==0) completed++;

}
else time++;

}

if(lastPid) schedule.push({pid:lastPid,start:startTime,end:time});

return schedule;

}

/* PRIORITY */

function priorityScheduling(data){

let time=0;
let completed=0;

let schedule=[];
let visited=new Array(data.length).fill(false);

while(completed<data.length){

let idx=-1;
let min=Infinity;

data.forEach((p,i)=>{
if(p.arrival<=time && !visited[i] && (p.priority ?? Infinity)<min){
min=p.priority;
idx=i;
}
});

if(idx!=-1){

let start=time;
time+=data[idx].burst;

schedule.push({pid:data[idx].pid,start,end:time});

visited[idx]=true;
completed++;

}
else time++;

}

return schedule;

}

/* ROUND ROBIN */

function roundRobin(data,quantum){

let time=0;
let queue=[];
let schedule=[];

let remaining=data.map(p=>p.burst);

let i=0;

data.sort((a,b)=>a.arrival-b.arrival);

while(true){

while(i<data.length && data[i].arrival<=time){
queue.push(i);
i++;
}

if(queue.length===0){

if(i<data.length) time=data[i].arrival;
else break;

}
else{

let idx=queue.shift();
let start=time;

if(remaining[idx]>quantum){

time+=quantum;
remaining[idx]-=quantum;

}
else{

time+=remaining[idx];
remaining[idx]=0;

}

schedule.push({pid:data[idx].pid,start,end:time});

while(i<data.length && data[i].arrival<=time){
queue.push(i);
i++;
}

if(remaining[idx]>0) queue.push(idx);

}

}

return schedule;

}

/* GANTT */

function drawGantt(schedule){

gantt.innerHTML="";
timeline.innerHTML="";

let total=schedule[schedule.length-1].end;

for(let i=0;i<=total;i++){

let span=document.createElement("span");
span.innerText=i;
timeline.appendChild(span);

}

schedule.forEach(task=>{

let bar=document.createElement("div");

bar.className="bar";
bar.style.width=(task.end-task.start)*40+"px";
bar.innerText=task.pid;

gantt.appendChild(bar);

});

}

/* METRICS */

function calculateMetrics(schedule,data){

let completion={}, firstExec={};

schedule.forEach(t=>{
if(!firstExec[t.pid]) firstExec[t.pid]=t.start;
completion[t.pid]=t.end;
});

let totalWT=0,totalTAT=0,totalRT=0;

data.forEach(p=>{

let tat=completion[p.pid]-p.arrival;
let wt=tat-p.burst;
let rt=firstExec[p.pid]-p.arrival;

totalWT+=wt;
totalTAT+=tat;
totalRT+=rt;

});

return{
avgWT:totalWT/data.length,
avgTAT:totalTAT/data.length,
avgRT:totalRT/data.length
};

}

/* RUN SINGLE */

function runSimulation(){

let algo=algorithm.value;

if(!algo){
alert("Select Algorithm");
return;
}

if(processes.length===0){
alert("Add processes first");
return;
}

let q=parseInt(quantum.value);

if(algo==="RR" && isNaN(q)){
q=parseInt(prompt("Enter Quantum Time"));
}

let data=JSON.parse(JSON.stringify(processes));

let schedule;

if(algo==="FCFS") schedule=fcfs(data);
else if(algo==="SJF") schedule=sjf(data);
else if(algo==="SRTF") schedule=srtf(data);
else if(algo==="PRIORITY") schedule=priorityScheduling(data);
else schedule=roundRobin(data,q);

drawGantt(schedule);

let m=calculateMetrics(schedule,data);

results.innerHTML=`
<h3>
Average Waiting Time : ${m.avgWT.toFixed(2)}<br>
Average Turnaround Time : ${m.avgTAT.toFixed(2)}<br>
Average Response Time : ${m.avgRT.toFixed(2)}
</h3>
`;

}

/* COMPARE ALL */

function compareAll(){

if(processes.length===0){
alert("Add processes first");
return;
}

processes.forEach(p=>{
if(p.priority===null){
let pr=parseInt(prompt(`Enter priority for ${p.pid}`));
if(!isNaN(pr)) p.priority=pr;
}
});

let q=parseInt(quantum.value);
if(isNaN(q)) q=parseInt(prompt("Enter Quantum Time for Round Robin"));

let algos={
"SRTF":srtf,
"SJF":sjf,
"FCFS":fcfs,
"Priority":priorityScheduling,
"Round Robin":(d)=>roundRobin(d,q)
};

let resultsData=[];

for(let name in algos){

let dataCopy=JSON.parse(JSON.stringify(processes));

let schedule=algos[name](dataCopy);

let m=calculateMetrics(schedule,dataCopy);

resultsData.push({name,...m});

}

resultsData.sort((a,b)=>a.avgWT-b.avgWT);

let best=resultsData[0].name;

/* TABLE */

let html="<table>";

html+="<tr><th>Algorithm</th><th>WT</th><th>TAT</th><th>RT</th></tr>";

resultsData.forEach((r,i)=>{

let highlight=i===0?"style='background:#00ffcc;color:black;'":"";

html+=`
<tr ${highlight}>
<td>${r.name}</td>
<td>${r.avgWT.toFixed(2)}</td>
<td>${r.avgTAT.toFixed(2)}</td>
<td>${r.avgRT.toFixed(2)}</td>
</tr>
`;

});

html+="</table>";

results.innerHTML=`
<h2 style="color:#00ffcc;">Best Algorithm</h2>
<h1 style="color:#00ffcc;">${best}</h1>
`+html;

/* CHARTS */

function createChart(id,label,data,color){

let ctx=document.getElementById(id).getContext("2d");

return new Chart(ctx,{
type:'bar',
data:{
labels:resultsData.map(r=>r.name),
datasets:[{
label:label,
data:data,
backgroundColor:color
}]
},
options:{scales:{y:{beginAtZero:true}}}
});

}

if(wtChartInstance) wtChartInstance.destroy();
if(tatChartInstance) tatChartInstance.destroy();
if(rtChartInstance) rtChartInstance.destroy();

wtChartInstance=createChart("wtChart","Average Waiting Time",
resultsData.map(r=>r.avgWT),'#2196f3');

tatChartInstance=createChart("tatChart","Average Turnaround Time",
resultsData.map(r=>r.avgTAT),'#ff9800');

rtChartInstance=createChart("rtChart","Average Response Time",
resultsData.map(r=>r.avgRT),'#4caf50');

}