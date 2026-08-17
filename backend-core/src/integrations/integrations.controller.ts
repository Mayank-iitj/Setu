import { Controller, Get, Query, Post, Body } from '@nestjs/common';

@Controller('integrations')
export class IntegrationsController {

  @Get('vahan/verify')
  getVahanDetails(@Query('vehicleNumber') vehicleNumber: string) {
    return {
      status: 'VALID',
      details: 'National Permit Active',
      rcNumber: vehicleNumber || 'RJ14GC1234',
      fitnessExpiry: '2027-01-01',
      payloadCapacityKg: 20000,
      bodyType: 'CONTAINER'
    };
  }

  @Get('ais140/location')
  getGpsLocation(@Query('vehicleId') deviceId: string) {
    // Return realistic random speed between 40 and 65 for demo purposes
    const speed = Math.floor(Math.random() * (65 - 40 + 1) + 40);
    return {
      deviceId: deviceId || 'v-1234',
      latitude: 28.7041,
      longitude: 77.1025,
      speed: speed,
      status: 'TRACKING',
      ignition: true,
      timestamp: new Date().toISOString()
    };
  }

  @Get('fastag/status')
  getFastagStatus(@Query('vehicleId') vehicleId: string) {
    return {
      vehicleId: vehicleId || 'v-1234',
      status: 'ACTIVE',
      lastToll: 'Jaipur_Toll_Plaza_1',
      timestamp: new Date().toISOString()
    };
  }

  @Get('nic/ewaybill/verify')
  getEwayBillStatus(@Query('ebNumber') ebNumber: string) {
    return {
      ewayBillNumber: ebNumber || 'EWB-892348923',
      status: 'ACTIVE',
      validUntil: '2026-10-10',
      totalValue: 150000
    };
  }

  @Post('digilocker/kyc')
  verifyDriverKyc(@Body() payload: any) {
    return {
      verified: true,
      driverId: payload?.driverId || 'DRV-999',
      drivingLicenseClass: 'HMV',
      backgroundCheck: 'CLEAR'
    };
  }
}
