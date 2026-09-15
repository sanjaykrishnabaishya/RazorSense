import sys
import os
import asyncio
import json

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
sys.stdout.reconfigure(encoding='utf-8')

from mcp_server import server

async def run_mcp_tests():
    print("=========================================================")
    print("🚀 RUNNING RAZORSENSE MCP SERVER LOCALHOST TEST SUITE")
    print("=========================================================\n")

    # 1. Test Tools Registration & Schemas
    print("[1/5] Testing MCP Tools List & Schemas...")
    tools = await server.list_tools()
    print(f"✅ Found {len(tools)} registered MCP Tools:")
    for t in tools:
        print(f"   • {t.name}: {t.description[:65]}...")
    assert len(tools) >= 7, "Expected at least 7 MCP tools"

    # 2. Test Resources List
    print("\n[2/5] Testing MCP Resources List...")
    resources = await server.list_resources()
    print(f"✅ Found {len(resources)} registered MCP Resources:")
    for r in resources:
        print(f"   • {r.uri} ({r.name})")
    assert len(resources) >= 3, "Expected at least 3 MCP resources"

    # 3. Test Prompts List
    print("\n[3/5] Testing MCP Prompts List...")
    prompts = await server.list_prompts()
    print(f"✅ Found {len(prompts)} registered MCP Prompts:")
    for p in prompts:
        print(f"   • {p.name}: {p.description}")
    assert len(prompts) >= 2, "Expected at least 2 MCP prompts"

    # 4. Test Live Tool Invocations
    print("\n[4/5] Executing Live MCP Tool Calls...")
    
    # Test 4a: search_orders (RentoMojo rentals)
    print("   Testing call_tool: search_orders(merchant='rentomojo')...")
    res_rent = await server.call_tool("search_orders", {"merchant": "rentomojo"})
    rent_text = res_rent.content[0].text
    rent_orders = json.loads(rent_text)
    print(f"   ✅ Returned {len(rent_orders)} RentoMojo rental orders:")
    for o in rent_orders:
        print(f"      - {o['order_id']} | {o['product']} | ₹{o['amount']} | {o['payment_mode']}")
    assert len(rent_orders) >= 2, "Expected at least 2 RentoMojo orders"

    # Test 4b: search_orders (BookMyShow Coldplay query)
    print("\n   Testing call_tool: search_orders(query='coldplay')...")
    res_coldplay = await server.call_tool("search_orders", {"query": "coldplay"})
    coldplay_orders = json.loads(res_coldplay.content[0].text)
    print(f"   ✅ Returned {len(coldplay_orders)} Coldplay match:")
    for o in coldplay_orders:
        print(f"      - {o['order_id']} | {o['merchant']} | {o['product']} | ₹{o['amount']}")
    assert len(coldplay_orders) >= 1, "Expected at least 1 Coldplay order"

    # Test 4c: search_policy_knowledge_base (Gaming SOP)
    print("\n   Testing call_tool: search_policy_knowledge_base('bgmi uc not credited')...")
    res_gaming_kb = await server.call_tool("search_policy_knowledge_base", {"query": "bgmi uc not credited"})
    kb_data = json.loads(res_gaming_kb.content[0].text)
    print(f"   ✅ Policy Retrieved:\n      \"{kb_data['policy'][:110]}...\"")
    assert "BGMI" in kb_data["policy"], "Expected BGMI gaming SOP"

    # Test 4d: get_order_details (28 January order)
    print("\n   Testing call_tool: get_order_details('ORD-1028')...")
    res_ord = await server.call_tool("get_order_details", {"order_id": "ORD-1028"})
    ord_data = json.loads(res_ord.content[0].text)
    print(f"   ✅ Order Details for ORD-1028:")
    print(f"      Item: {ord_data['product']} | Date: {ord_data['order_date']} | Paid via: {ord_data['payment_mode']}")
    assert ord_data["order_id"] == "ORD-1028"

    # 5. Test Live Resource Reading & Prompts
    print("\n[5/5] Testing Resource Reading & Prompt Rendering...")
    merchants_res = await server.read_resource("razorsense://catalog/merchants")
    merchants_catalog = json.loads(merchants_res[0].content)
    print(f"   ✅ Merchant Catalog Verticals: {list(merchants_catalog.keys())}")

    prompt_res = await server.get_prompt("dispute_defense", {"order_id": "ORD-9932", "issue_type": "fraud"})
    print(f"   ✅ Rendered Dispute Defense Prompt ({len(prompt_res.messages[0].content.text)} chars)")

    print("\n=========================================================")
    print("🎉 ALL LOCALHOST MCP SERVER TESTS PASSED SUCCESSFULLY!")
    print("=========================================================")

if __name__ == "__main__":
    asyncio.run(run_mcp_tests())
