require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('../models/Item');

const demoItems = [
  {
    itemCode: 'TVSE-SCN-01',
    name: 'Barcode Scanner',
    itemType: 'FG',
    unitOfMeasure: 'PCS',
    description: 'TVSE handheld barcode scanner, finished good, assembled on the SMT + assembly line.',
    status: 'Active',
  },
  {
    itemCode: 'TVSE-PRN-01',
    name: 'Thermal Printer',
    itemType: 'FG',
    unitOfMeasure: 'PCS',
    description: 'TVSE thermal receipt printer, finished good, assembled on the SMT + assembly line.',
    status: 'Active',
  },
  {
    itemCode: 'TVSE-MOU-01',
    name: 'Wireless Mouse',
    itemType: 'FG',
    unitOfMeasure: 'PCS',
    description: 'TVSE wireless optical mouse, finished good, assembled on the SMT + assembly line.',
    status: 'Active',
  },
  {
    itemCode: 'TVSE-PCB-01',
    name: 'Main PCB Assembly',
    itemType: 'WIP',
    unitOfMeasure: 'PCS',
    description: 'Populated PCB used as a component inside scanners, printers, and mice.',
    status: 'Active',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    for (const data of demoItems) {
      const existing = await Item.findOne({ itemCode: data.itemCode });
      if (existing) {
        console.log(`Skipped (already exists): ${data.itemCode}`);
        continue;
      }
      await Item.create(data);
      console.log(`Created: ${data.itemCode} - ${data.name}`);
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();