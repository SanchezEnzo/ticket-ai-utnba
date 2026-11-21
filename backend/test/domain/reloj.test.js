import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ahora, fijarAhora, restaurarReloj, diasCalendario, sumarDias } from '../../src/domain/reloj.js';

describe('reloj', () => {
  afterEach(() => {
    restaurarReloj();
  });

  describe('diasCalendario', () => {
    it('mismo día da 0', () => {
      fijarAhora(new Date(Date.UTC(2026, 0, 15, 12, 0, 0)));
      const hoy = ahora();
      assert.equal(diasCalendario(hoy, hoy), 0);
    });

    it('mañana a la noche da 1 día', () => {
      // Fijar reloj a medianoche en Argentina (03:00 UTC)
      fijarAhora(new Date(Date.UTC(2026, 0, 15, 3, 0, 0)));
      const hoy = ahora();
      const mananaNoche = sumarDias(hoy, 1);
      mananaNoche.setUTCHours(22, 0, 0, 0);
      assert.equal(diasCalendario(hoy, mananaNoche), 1);
    });

    it('cruce de medianoche en hora argentina', () => {
      // Argentina es UTC-3, así que:
      // 23:00 ARG el 15 = 02:00 UTC el 16
      const dia1_23hs = new Date(Date.UTC(2026, 0, 16, 2, 0, 0));
      // 01:00 ARG el 16 = 04:00 UTC el 16
      const dia2_01hs = new Date(Date.UTC(2026, 0, 16, 4, 0, 0));
      assert.equal(diasCalendario(dia1_23hs, dia2_01hs), 1);
    });

    it('varios días', () => {
      fijarAhora(new Date(Date.UTC(2026, 0, 1, 12, 0, 0)));
      const base = ahora();
      const mas5 = sumarDias(base, 5);
      assert.equal(diasCalendario(base, mas5), 5);
    });

    it('diferencia negativa devuelve negativo', () => {
      fijarAhora(new Date(Date.UTC(2026, 0, 10, 12, 0, 0)));
      const base = ahora();
      const menos3 = sumarDias(base, -3);
      assert.equal(diasCalendario(base, menos3), -3);
    });
  });
});
