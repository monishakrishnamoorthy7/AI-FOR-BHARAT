const ZONES = [
  { id:'whitefield', name:'Whitefield', type:'IT', basePeak:88, evGrowth:42, tier:1, demand:87, headroom:71, access:62, coverage:83, composite:91, stations:5, lat: 12.9698, lng: 77.7499, feederHealth: 0.65 },
  { id:'hsr', name:'HSR Layout', type:'Mixed', basePeak:82, evGrowth:38, tier:1, demand:83, headroom:68, access:74, coverage:70, composite:87, stations:4, lat: 12.9121, lng: 77.6446, feederHealth: 0.58 },
  { id:'electronic_city', name:'Electronic City', type:'IT', basePeak:79, evGrowth:35, tier:1, demand:79, headroom:75, access:58, coverage:65, composite:83, stations:4, lat: 12.8452, lng: 77.6633, feederHealth: 0.72 },
  { id:'marathahalli', name:'Marathahalli', type:'Mixed', basePeak:76, evGrowth:33, tier:1, demand:75, headroom:63, access:70, coverage:71, composite:81, stations:3, lat: 12.9569, lng: 77.7011, feederHealth: 0.60 },
  { id:'koramangala', name:'Koramangala', type:'Commercial', basePeak:74, evGrowth:28, tier:2, demand:68, headroom:55, access:88, coverage:42, composite:74, stations:3, lat: 12.9352, lng: 77.6245, feederHealth: 0.85 },
  { id:'indiranagar', name:'Indiranagar', type:'Commercial', basePeak:70, evGrowth:25, tier:2, demand:63, headroom:58, access:82, coverage:38, composite:69, stations:2, lat: 12.9719, lng: 77.6412, feederHealth: 0.88 },
  { id:'btm', name:'BTM Layout', type:'Mixed', basePeak:68, evGrowth:22, tier:2, demand:60, headroom:62, access:65, coverage:55, composite:63, stations:2, lat: 12.9166, lng: 77.6101, feederHealth: 0.82 },
  { id:'jayanagar', name:'Jayanagar', type:'Residential', basePeak:65, evGrowth:18, tier:3, demand:52, headroom:70, access:55, coverage:48, composite:58, stations:1, lat: 12.9250, lng: 77.5898, feederHealth: 0.92 },
  { id:'hebbal', name:'Hebbal', type:'Mixed', basePeak:63, evGrowth:20, tier:3, demand:55, headroom:65, access:50, coverage:52, composite:55, stations:1, lat: 13.0354, lng: 77.5988, feederHealth: 0.89 },
  { id:'yelahanka', name:'Yelahanka', type:'Residential', basePeak:55, evGrowth:15, tier:3, demand:45, headroom:72, access:42, coverage:60, composite:48, stations:1, lat: 13.1007, lng: 77.5963, feederHealth: 0.94 },
  { id:'banashankari', name:'Banashankari', type:'Residential', basePeak:52, evGrowth:12, tier:4, headroom:78, access:45, coverage:35, composite:41, stations:0, lat: 12.9254, lng: 77.5468, feederHealth: 0.96 },
  { id:'jp_nagar', name:'JP Nagar', type:'Residential', basePeak:50, evGrowth:10, tier:4, demand:35, headroom:80, access:40, coverage:30, composite:38, stations:0, lat: 12.9063, lng: 77.5857, feederHealth: 0.95 },
];

const CORRIDORS = [
  { 
    zones:['Whitefield','Marathahalli','Electronic City'], 
    stations:5, 
    road:'ITPL Main Road / ORR', 
    timeline:'Q3 2025',
    path: [
      [12.9698, 77.7499], // Whitefield
      [12.9569, 77.7011], // Marathahalli
      [12.8452, 77.6633], // Electronic City
    ]
  },
  { 
    zones:['HSR Layout','Koramangala','BTM Layout'], 
    stations:4, 
    road:'Outer Ring Road South', 
    timeline:'Q4 2025',
    path: [
      [12.9121, 77.6446], // HSR Layout
      [12.9352, 77.6245], // Koramangala
      [12.9166, 77.6101], // BTM Layout
    ]
  },
];

const INITIAL_TWIN = {
  appliances: [
    { id:'ac', name:'Air Conditioning', kw:2.2, on:true, color:'#00E5FF' },
    { id:'fridge', name:'Refrigerator', kw:0.3, on:true, color:'#10B981' },
    { id:'washer', name:'Washing Machine', kw:1.8, on:false, color:'#A855F7' },
    { id:'heater', name:'Water Heater', kw:2.0, on:false, color:'#F59E0B' },
  ],
  evSlots: [
    { id:1, battery:22, status:'charging', kw:3.3, present:true },
    { id:2, battery:65, status:'charging', kw:3.3, present:true },
    { id:3, battery:45, status:'queued', kw:0, present:true },
    { id:4, battery:88, status:'queued', kw:0, present:false },
  ],
  maxCapacity: 6.0,
};

module.exports = {
  ZONES,
  CORRIDORS,
  INITIAL_TWIN
};
