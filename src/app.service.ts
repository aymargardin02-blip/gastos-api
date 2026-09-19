import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getSalud() { 
    return { estado: 'ok', servicio:  'gastos-api' }; 
  }
}
