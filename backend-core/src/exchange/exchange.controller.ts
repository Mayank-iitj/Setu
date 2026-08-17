import { Controller, Post, Body } from '@nestjs/common';

@Controller('exchange')
export class ExchangeController {

  @Post('load')
  postLoad(@Body() payload: any) {
    // Simulate pushing to a combinatorial exchange
    console.log(`[Exchange] Received load: ${payload.origin} to ${payload.destination}`);
    return {
      status: 'MATCHED',
      bundleId: `BND-${Math.floor(Math.random() * 10000)}`,
      carrier: {
        id: 'carrier_2',
        name: 'NCR Logistics',
        vehicleId: 'RJ14GC1234'
      },
      estimatedPrice: 14500,
      timestamp: new Date().toISOString()
    };
  }

  @Post('bid')
  submitBid(@Body() payload: any) {
    console.log(`[Exchange] Received bid for bundle ${payload.bundleId} at ₹${payload.amount}`);
    return {
      status: 'ACCEPTED',
      bundleId: payload.bundleId,
      amount: payload.amount,
      awarded: true,
      timestamp: new Date().toISOString()
    };
  }

  @Post('pod')
  uploadPod(@Body() payload: any) {
    console.log(`[Exchange] e-POD received for assignment ${payload.assignmentId}`);
    return {
      status: 'VERIFIED',
      assignmentId: payload.assignmentId,
      settlementStatus: 'PROCESSING',
      timestamp: new Date().toISOString()
    };
  }
}
