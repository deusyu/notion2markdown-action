#!/bin/bash

# Notion API 测试脚本
# 使用方法: ./test-api.sh

# 配置变量 - 请填入你的真实值
NOTION_SECRET="填入你的NOTION_TOKEN"
DATABASE_ID="填入你的NOTION_DATABASE_ID"

# 检查配置
if [[ "$NOTION_SECRET" == "填入你的NOTION_TOKEN" || "$DATABASE_ID" == "填入你的NOTION_DATABASE_ID" ]]; then
    echo "❌ 请先在脚本中填入你的NOTION_SECRET和DATABASE_ID"
    exit 1
fi

echo "🔍 开始测试Notion API连接..."
echo "Database ID: $DATABASE_ID"
echo "Secret: ${NOTION_SECRET:0:20}..." 
echo ""

# 1. 测试数据库基本信息
echo "📋 1. 获取数据库信息..."
response1=$(curl -s -X GET "https://api.notion.com/v1/databases/$DATABASE_ID" \
  -H "Authorization: Bearer $NOTION_SECRET" \
  -H 'Notion-Version: 2022-06-28')

# 检查是否有错误
if echo "$response1" | jq -e '.object == "error"' > /dev/null 2>&1; then
    echo "❌ 错误: $(echo "$response1" | jq -r '.message')"
    echo "状态码: $(echo "$response1" | jq -r '.status')"
    exit 1
else
    echo "✅ 数据库信息获取成功"
    echo "数据库标题: $(echo "$response1" | jq -r '.title[0].plain_text // "无标题"')"
    echo "属性数量: $(echo "$response1" | jq '.properties | length')"
    
    # 显示状态字段信息
    status_field=$(echo "$response1" | jq -r '.properties.status // .properties.Status // .properties.pstatus // "未找到"')
    if [[ "$status_field" != "未找到" ]]; then
        echo "状态字段: 找到"
        echo "$response1" | jq -r '.properties | to_entries[] | select(.value.type == "select") | "  - \(.key): \(.value.select.options[].name)"' 2>/dev/null || echo "  无法解析状态选项"
    else
        echo "⚠️  未找到status/Status/pstatus字段，请检查状态字段名"
    fi
fi

echo ""

# 2. 测试基础查询
echo "📄 2. 查询页面（前3个）..."
response2=$(curl -s -X POST "https://api.notion.com/v1/databases/$DATABASE_ID/query" \
  -H "Authorization: Bearer $NOTION_SECRET" \
  -H 'Content-Type: application/json' \
  -H 'Notion-Version: 2022-06-28' \
  -d '{"page_size": 3}')

if echo "$response2" | jq -e '.object == "error"' > /dev/null 2>&1; then
    echo "❌ 查询错误: $(echo "$response2" | jq -r '.message')"
else
    page_count=$(echo "$response2" | jq '.results | length')
    echo "✅ 查询成功，找到 $page_count 个页面"
    
    # 显示页面信息
    echo "$response2" | jq -r '.results[] | "  - \(.properties.title.title[0].plain_text // .properties.Title.title[0].plain_text // "无标题") (ID: \(.id))"' 2>/dev/null || echo "  无法解析页面标题"
fi

echo ""

# 3. 测试已发布页面查询
echo "📝 3. 查询已发布页面..."
response3=$(curl -s -X POST "https://api.notion.com/v1/databases/$DATABASE_ID/query" \
  -H "Authorization: Bearer $NOTION_SECRET" \
  -H 'Content-Type: application/json' \
  -H 'Notion-Version: 2022-06-28' \
  -d '{
    "filter": {
      "property": "pstatus", 
      "select": {
        "equals": "已发布"
      }
    },
    "page_size": 5
  }')

if echo "$response3" | jq -e '.object == "error"' > /dev/null 2>&1; then
    echo "❌ 查询已发布页面错误: $(echo "$response3" | jq -r '.message')"
    echo "💡 可能的原因:"
    echo "   - 状态字段名不是'status'，请检查数据库字段名"
    echo "   - 状态值不是'已发布'，请检查实际的状态值"
else
    published_count=$(echo "$response3" | jq '.results | length')
    echo "✅ 找到 $published_count 个已发布页面"
    
    if [[ $published_count -gt 0 ]]; then
        echo "已发布页面:"
        echo "$response3" | jq -r '.results[] | "  - \(.properties.title.title[0].plain_text // .properties.Title.title[0].plain_text // "无标题")"' 2>/dev/null || echo "  无法解析页面标题"
        
        # 获取第一个页面ID用于后续测试
        FIRST_PAGE_ID=$(echo "$response3" | jq -r '.results[0].id')
        echo "第一个页面ID: $FIRST_PAGE_ID"
    else
        echo "⚠️  没有找到已发布的页面，请检查:"
        echo "   - 数据库中是否有状态为'已发布'的页面"
        echo "   - 状态字段名是否正确"
        echo "   - 状态值是否为'已发布'"
    fi
fi

echo ""

# 4. 如果有已发布页面，测试获取页面内容
if [[ -n "$FIRST_PAGE_ID" && "$FIRST_PAGE_ID" != "null" ]]; then
    echo "🎬 4. 获取页面内容块（检查是否有视频）..."
    response4=$(curl -s -X GET "https://api.notion.com/v1/blocks/$FIRST_PAGE_ID/children" \
      -H "Authorization: Bearer $NOTION_SECRET" \
      -H 'Notion-Version: 2022-06-28')
    
    if echo "$response4" | jq -e '.object == "error"' > /dev/null 2>&1; then
        echo "❌ 获取页面内容错误: $(echo "$response4" | jq -r '.message')"
    else
        block_count=$(echo "$response4" | jq '.results | length')
        echo "✅ 页面包含 $block_count 个内容块"
        
        # 检查视频块
        video_count=$(echo "$response4" | jq '[.results[] | select(.type == "video")] | length')
        image_count=$(echo "$response4" | jq '[.results[] | select(.type == "image")] | length')
        
        echo "📹 视频块数量: $video_count"
        echo "🖼️  图片块数量: $image_count"
        
        if [[ $video_count -gt 0 ]]; then
            echo "视频块详情:"
            echo "$response4" | jq -r '.results[] | select(.type == "video") | "  - 类型: \(.video.type // "未知"), URL: \(.video.external.url // .video.file.url // "无URL")"' 2>/dev/null
        fi
    fi
else
    echo "⚠️  跳过页面内容测试（没有可用的页面ID）"
fi

echo ""
echo "🎉 API测试完成！"
echo ""
echo "📝 总结:"
echo "✅ 如果所有测试都通过，说明你的Notion配置正确"
echo "🔧 如果有错误，请根据错误信息调整配置"
echo "📋 下一步可以运行: npm run test:local 进行完整测试" 