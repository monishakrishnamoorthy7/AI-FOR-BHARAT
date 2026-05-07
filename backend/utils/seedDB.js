require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Alert = require('../models/Alert');
const Forecast = require('../models/Forecast');
const Siting = require('../models/Siting');
const TwinLog = require('../models/TwinLog');

const { ZONES } = require('../data/mockData');
const { generateDemandCurve, generateAlerts, generateSiteLocations } = require('./helpers');

const seedData = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await Alert.deleteMany();
    await Forecast.deleteMany();
    await Siting.deleteMany();
    await TwinLog.deleteMany();

    console.log('🌱 Seeding Alerts...');
    const alerts = generateAlerts();
    await Alert.insertMany(alerts);

    console.log('🌱 Seeding Forecasts...');
    const forecasts = ZONES.map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      curve: generateDemandCurve(zone)
    }));
    await Forecast.insertMany(forecasts);

    console.log('🌱 Seeding Sitings...');
    let allSites = [];
    ZONES.forEach(zone => {
      const sites = generateSiteLocations(zone);
      sites.forEach(site => {
        allSites.push({ ...site, zoneId: zone.id });
      });
    });
    await Siting.insertMany(allSites);

    console.log('✅ Database Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
