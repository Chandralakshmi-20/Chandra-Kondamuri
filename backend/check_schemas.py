import ast
import pathlib

router_folder = pathlib.Path("app/routers")

for file in sorted(router_folder.glob("*.py")):
    tree = ast.parse(file.read_text(encoding="utf-8"))

    schemas = []

    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            if node.module == "schemas":
                for name in node.names:
                    schemas.append(name.name)

    if schemas:
        print(f"\n{file.name}")
        for schema in schemas:
            print(f"  - {schema}")