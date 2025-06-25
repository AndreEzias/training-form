// Script de migração de localStorage para SQLite
// Execute no console do browser para migrar dados existentes

export function migrateFromLocalStorage() {
    // Verifica se estamos no browser
    if (typeof window === 'undefined' || !localStorage) {
        console.log('Este script deve ser executado no browser');
        return;
    }

    const localWorkouts = localStorage.getItem('workouts');
    if (!localWorkouts) {
        console.log('Nenhum dado encontrado no localStorage');
        return;
    }

    try {
        const workouts = JSON.parse(localWorkouts);
        const workoutNames = Object.keys(workouts);
        
        if (workoutNames.length === 0) {
            console.log('Nenhum treino encontrado para migrar');
            return;
        }

        console.log(`Encontrados ${workoutNames.length} treinos para migrar:`, workoutNames);

        // Migra cada treino
        const promises = workoutNames.map(async (name) => {
            try {
                const response = await fetch('/api/workouts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        name, 
                        data: workouts[name] 
                    }),
                });

                if (response.ok) {
                    console.log(`✅ Treino "${name}" migrado com sucesso`);
                    return { name, success: true };
                } else {
                    console.error(`❌ Erro ao migrar treino "${name}":`, await response.text());
                    return { name, success: false };
                }
            } catch (error) {
                console.error(`❌ Erro ao migrar treino "${name}":`, error);
                return { name, success: false };
            }
        });

        // Aguarda todas as migrações
        Promise.all(promises).then((results) => {
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            console.log(`\n📊 Migração concluída:`);
            console.log(`✅ Sucessos: ${successful.length}`);
            console.log(`❌ Falhas: ${failed.length}`);

            if (successful.length > 0) {
                console.log(`\n🎉 Treinos migrados com sucesso:`, successful.map(r => r.name));
                
                // Pergunta se deseja fazer backup do localStorage
                if (confirm('Migração concluída! Deseja fazer backup dos dados do localStorage antes de limpá-los?')) {
                    const backup = {
                        timestamp: new Date().toISOString(),
                        data: workouts
                    };
                    
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `workouts-backup-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    console.log('📁 Backup salvo!');
                }

                // Pergunta se deseja limpar o localStorage
                if (confirm('Deseja limpar os dados do localStorage agora que foram migrados para SQLite?')) {
                    localStorage.removeItem('workouts');
                    console.log('🧹 localStorage limpo!');
                }
            }

            if (failed.length > 0) {
                console.log(`\n❌ Treinos que falharam:`, failed.map(r => r.name));
            }
        });

    } catch (error) {
        console.error('Erro ao processar dados do localStorage:', error);
    }
}

// Para executar no console do browser:
// migrateFromLocalStorage();
