# sabanaderma-control — Brief

> Este es el resumen de tu proyecto tal como lo confirmaste en raicode.ai.
> Vive en la raíz de la carpeta del proyecto como referencia rápida.
> Si necesitas las reglas de comportamiento de Claude, ve a `CLAUDE.md`.

## La idea

Sistema para registrar pacientes, asignarles procedimientos con insumos y generar histórico de facturación y honorarios médicos

## Para quién

Clínica dermatológica: dueño y personal que registra pacientes y procedimientos

## Cómo lo hacen hoy

Excel o Google Sheets

## Qué duele del proceso

Errores al vincular insumos con pacientes y procedimientos

## Qué te cuesta (la causa raíz)

Insumos usados que no se registran: ni se cobran al paciente ni se descuentan del inventario — el negocio pierde plata sin verlo

## MVP (punto de partida)

Registrar un paciente, asignarle un procedimiento con sus insumos y precio, y que quede guardado en el historial

## Guarda información

Sí — el proyecto guarda datos (usamos Supabase)

## Privacidad

🔒 **App privada** — guarda info que solo el dueño o personas específicas deberían ver. Requiere auth (login con usuarios) configurado antes del deploy a Vercel.
