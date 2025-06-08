#!/bin/bash

# Cloudflare R2 简单连接测试
# 使用curl和AWS CLI兼容的方式

echo "🔗 简单的Cloudflare R2连接测试..."
echo ""

# 从配置文件读取参数 - 请填入你的真实值
ACCESS_KEY="填入你的ACCESS_KEY"
SECRET_KEY="填入你的SECRET_KEY"
BUCKET="填入你的BUCKET名"
ENDPOINT="填入你的ENDPOINT"

echo "📋 测试配置:"
echo "   - Endpoint: $ENDPOINT"
echo "   - Bucket: $BUCKET"
echo "   - Access Key: ${ACCESS_KEY:0:8}..."
echo ""

# 测试1: 简单的HEAD请求到bucket
echo "🪣 测试1: 检查Bucket是否存在..."

response=$(curl -s -I "$ENDPOINT/$BUCKET/" \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=$ACCESS_KEY/20250608/auto/s3/aws4_request, SignedHeaders=host, Signature=dummy" 2>&1)

echo "响应头信息:"
echo "$response"
echo ""

# 测试2: 检查是否需要AWS CLI
echo "🔧 测试2: 检查是否有aws cli..."
if command -v aws &> /dev/null; then
    echo "✅ 找到AWS CLI"
    
    echo "📤 尝试使用AWS CLI列出bucket内容..."
    
    # 配置aws cli使用R2端点
    aws configure set aws_access_key_id "$ACCESS_KEY" --profile r2test
    aws configure set aws_secret_access_key "$SECRET_KEY" --profile r2test
    aws configure set region auto --profile r2test
    
    # 列出bucket内容
    aws s3 ls "s3://$BUCKET/" --endpoint-url="$ENDPOINT" --profile r2test --no-verify-ssl 2>&1 | head -10
else
    echo "❌ 没有找到AWS CLI"
    echo "💡 建议安装AWS CLI进行测试: brew install awscli"
fi

echo ""
echo "📝 诊断建议:"
echo "1. 确认Access Key和Secret Key是否正确"
echo "2. 确认Bucket名称是否正确" 
echo "3. 确认endpoint URL是否正确"
echo "4. 检查Cloudflare R2控制台中的API令牌权限"
echo ""
echo "🔗 如果有Cloudflare账户，可以在R2控制台验证:"
echo "   - 进入Cloudflare Dashboard > R2 Object Storage"
echo "   - 检查bucket '$BUCKET' 是否存在"
echo "   - 检查API令牌是否有正确的权限" 