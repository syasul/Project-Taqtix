import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { OrganizerEventsController } from './organizer-events.controller';

@Module({
  controllers: [EventsController, OrganizerEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
