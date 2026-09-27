#!/usr/bin/env python3
"""
CLI Tool for Batch Generating TOEFL Exercises with Gemini
Usage:
    python3 generate_exercises.py --section reading --count 2
    python3 generate_exercises.py --section writing --count 3
    python3 generate_exercises.py --topic "Astrobiology" --section reading
"""

import argparse
import json
import os
import sys
from server import check_gemini_cli, build_prompt_for_section, call_gemini_cli

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
READING_FILE = os.path.join(BASE_DIR, "exercises.json")
WRITING_FILE = os.path.join(BASE_DIR, "writing_exercises.json")

def load_json(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

def main():
    parser = argparse.ArgumentParser(description="Generar ejercicios TOEFL con Gemini CLI")
    parser.add_argument("--section", choices=["reading", "writing"], default="reading", help="Sección a generar (reading o writing)")
    parser.add_argument("--count", type=int, default=1, help="Número de ejercicios a generar")
    parser.add_argument("--topic", type=str, default=None, help="Tema opcional específico para el ejercicio")
    parser.add_argument("--model", type=str, default="gemini-3.8-flash-high", help="Modelo de Gemini a usar (default: gemini-3.8-flash-high)")
    args = parser.parse_args()

    cli = check_gemini_cli()
    if not cli:
        print("❌ Error: No se encontró la herramienta 'gemini' o 'agy' en tu sistema.")
        sys.exit(1)

    print(f"✨ Conectado a Gemini CLI: {cli} (Modelo: {args.model})")
    print(f"📚 Generando {args.count} ejercicio(s) para la sección [{args.section.upper()}]...")

    target_file = READING_FILE if args.section == "reading" else WRITING_FILE
    existing_data = load_json(target_file)
    existing_ids = set(e.get("id") for e in existing_data)
    existing_titles = [e.get("title", "") for e in existing_data if "title" in e]

    generated_count = 0
    for i in range(args.count):
        print(f"\n⏳ [{i+1}/{args.count}] Solicitando nuevo ejercicio inédito a {args.model}...")
        prompt = build_prompt_for_section(
            section=args.section,
            avoid_titles=existing_titles,
            avoid_ids=list(existing_ids),
            custom_topic=args.topic
        )

        try:
            exercise = call_gemini_cli(prompt, model=args.model)
            # Ensure unique id
            base_id = exercise.get("id", f"{args.section}-{len(existing_data)+1}")
            unique_id = base_id
            counter = 1
            while unique_id in existing_ids:
                unique_id = f"{base_id}-{counter}"
                counter += 1
            exercise["id"] = unique_id

            existing_data.append(exercise)
            existing_ids.add(unique_id)
            existing_titles.append(exercise.get("title", unique_id))
            generated_count += 1

            print(f"✅ Ejercicio generado con éxito:")
            print(f"   Título: {exercise.get('title')}")
            print(f"   Categoría: {exercise.get('category')}")
            print(f"   ID: {exercise.get('id')}")

        except Exception as e:
            print(f"❌ Error al generar el ejercicio: {e}")

    if generated_count > 0:
        save_json(target_file, existing_data)
        print(f"\n🎉 ¡Se guardaron {generated_count} nuevos ejercicios en '{os.path.basename(target_file)}'!")
        print(f"📊 Total de ejercicios en {args.section}: {len(existing_data)}")

if __name__ == "__main__":
    main()
